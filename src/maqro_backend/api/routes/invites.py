"""
Invite API routes for salesperson invitations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from maqro_backend.api.deps import get_db_session, get_current_user_id, get_user_dealership_id, require_dealership_manager
from maqro_backend.schemas.invite import (
    InviteCreate, 
    InviteResponse, 
    InviteAccept,
    InviteListResponse
)
from maqro_backend.crud import (
    create_invite,
    get_invite_by_token,
    get_invites_by_dealership,
    update_invite_status,
    create_user_profile
)
from maqro_backend.services.roles_service import RolesService
from maqro_backend.crud import get_user_profile_by_user_id
from sqlalchemy import select
from maqro_backend.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/invites/verify", response_model=dict)
async def verify_invite(
    token: str,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Public endpoint to verify if an invite token is valid.

    Returns dealership and role information if valid.
    """
    try:
        invite = await get_invite_by_token(session=db, token=token)

        if not invite:
            return {"valid": False, "reason": "Invalid or expired invite token"}

        # Check status and expiry
        from datetime import datetime
        if invite.status != "pending":
            return {"valid": False, "reason": "Invite already used or cancelled"}
        if invite.expires_at and invite.expires_at < datetime.utcnow():
            return {"valid": False, "reason": "Invite has expired"}

        # Get dealership name if available
        dealership_name = ""
        try:
            from maqro_backend.db.models import Dealership
            result = await db.execute(
                select(Dealership.name).where(Dealership.id == invite.dealership_id)
            )
            dealership_name = result.scalar_one_or_none() or ""
        except Exception:
            dealership_name = ""

        return {
            "valid": True,
            "dealership_id": str(invite.dealership_id),
            "dealership_name": dealership_name or "Unknown Dealership",
            "role_name": invite.role,
            "email": invite.email,
            "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
        }
    except Exception as e:
        logger.error(f"Error verifying invite: {e}")
        return {"valid": False, "reason": "Failed to verify invite token"}


@router.post("/invites", response_model=InviteResponse)
async def create_new_invite(
    invite_data: InviteCreate,
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id)
):
    """
    Create a new invite for a salesperson
    
    Requires manager or owner role.
    """
    logger.info(f"Creating invite for email: {invite_data.email} by user: {user_id}")
    
    # Check if user has permission to create invites (manager or owner)
    current_user_profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    if not current_user_profile or current_user_profile.role not in ['owner', 'manager']:
        raise HTTPException(
            status_code=403, 
            detail="You need manager or owner permissions to create invites"
        )
    
    try:
        # Force all invites to salesperson role from the API to avoid privilege escalation
        enforced_role = "salesperson"

        invite = await create_invite(
            session=db,
            dealership_id=dealership_id,
            email=invite_data.email,
            role_name=enforced_role,
            invited_by=user_id,
            expires_in_days=invite_data.expires_in_days
        )
        
        logger.info(f"Invite created with ID: {invite.id}")
        
        invite_response = InviteResponse(
            id=str(invite.id),
            dealership_id=str(invite.dealership_id),
            email=invite.email,
            token=invite.token_hash,
            role_name=invite.role,
            invited_by=str(invite.invited_by),
            created_at=invite.created_at,
            expires_at=invite.expires_at,
            status=invite.status
        )

        # Send invite email via Supabase Admin email (passwordless link-like)
        try:
            from supabase import create_client, Client
            import os

            supabase_url = os.getenv("SUPABASE_URL")
            supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

            if supabase_url and supabase_service_key:
                supabase: Client = create_client(supabase_url, supabase_service_key)

                # Build invite link to our signup with token
                frontend_base = settings.frontend_base_url or "http://localhost:3000"
                invite_link = f"{frontend_base}/signup?token={invite.token_hash}"

                # Send email using magic link invite: we send a direct email with invite_link
                # Supabase Admin API supports invite_user_by_email for projects using email auth
                try:
                    supabase.auth.admin.invite_user_by_email(invite.email)
                except Exception:
                    # Fallback: send password reset email as an invite mechanism (if enabled)
                    pass

                # Additionally, send a custom email via supabase SMTP relay is not directly available here.
                # For now, log the link; the app shows copy link, and supabase sends invite email.
                logger.info(f"📧 Invite email requested via Supabase for {invite.email}. Link: {invite_link}")
            else:
                logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; skipping email send")
        except Exception as e:
            logger.error(f"Failed to dispatch invite email: {e}")

        return invite_response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating invite: {e}")
        raise HTTPException(status_code=500, detail="Failed to create invite")


@router.get("/invites", response_model=List[InviteListResponse])
async def get_dealership_invites(
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id)
):
    """
    Get all invites for the current dealership
    
    Requires manager or owner role.
    """
    # Check if user has permission to view invites
    current_user_profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    if not current_user_profile or current_user_profile.role not in ['owner', 'manager']:
        raise HTTPException(
            status_code=403, 
            detail="You need manager or owner permissions to view invites"
        )
    
    invites = await get_invites_by_dealership(session=db, dealership_id=dealership_id)
    
    return [
        InviteListResponse(
            id=str(invite.id),
            email=invite.email,
            role_name=invite.role,
            invited_by=str(invite.invited_by),
            created_at=invite.created_at,
            expires_at=invite.expires_at,
            status=invite.status
        ) for invite in invites
    ]


@router.post("/invites/accept", response_model=dict)
async def accept_invite(
    accept_data: InviteAccept,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Accept an invite and create a new user account
    
    This endpoint is public and doesn't require authentication.
    """
    logger.info(f"Processing invite acceptance for token: {accept_data.token[:10]}...")
    
    # Get the invite by token
    invite = await get_invite_by_token(session=db, token=accept_data.token)
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite")
    
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite has already been used or expired")
    
    # Check if invite has expired
    from datetime import datetime
    if invite.expires_at < datetime.utcnow():
        # Mark as expired
        await update_invite_status(session=db, invite_id=str(invite.id), status="expired")
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    try:
        # Create user account using Supabase Auth
        from supabase import create_client, Client
        import os
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_service_key:
            raise HTTPException(status_code=500, detail="Supabase configuration missing")
        
        supabase: Client = create_client(supabase_url, supabase_service_key)
        
        # Create the user account
        auth_response = supabase.auth.admin.create_user({
            "email": invite.email,
            "password": accept_data.password,
            "email_confirm": True
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=500, detail="Failed to create user account")
        
        new_user_id = auth_response.user.id
        
        # Map role name for compatibility
        role_for_profile = invite.role
        if role_for_profile == 'admin':
            role_for_profile = 'owner'  # Map admin to owner for consistency
        
        # Create user profile
        await create_user_profile(
            session=db,
            user_id=new_user_id,
            dealership_id=str(invite.dealership_id),
            full_name=accept_data.full_name,
            phone=accept_data.phone,
            role=role_for_profile,
            timezone="America/New_York"
        )
        
        # Try to assign user role in new system if it exists
        try:
            await RolesService.assign_user_role(
                db=db,
                user_id=new_user_id,
                dealership_id=str(invite.dealership_id),
                role_name=role_for_profile,
                assigned_by=str(invite.invited_by)
            )
        except Exception as e:
            # If new role system doesn't exist or fails, that's okay
            # The user profile with role will work for the old system
            logger.warning(f"Could not assign role in new system: {e}")
        
        # Mark invite as accepted
        await update_invite_status(
            session=db, 
            invite_id=str(invite.id), 
            status="accepted",
            used_at=datetime.utcnow()
        )
        
        logger.info(f"Invite accepted successfully for user: {new_user_id}")
        
        return {
            "success": True,
            "message": "Account created successfully! You can now sign in.",
            "user_id": new_user_id
        }
        
    except Exception as e:
        logger.error(f"Error accepting invite: {e}")
        raise HTTPException(status_code=500, detail="Failed to create account")


@router.post("/invites/complete", response_model=dict)
async def complete_invite_for_existing_user(
    payload: dict,
    db: AsyncSession = Depends(get_db_session),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Complete an invite for an already authenticated user.

    This attaches the current user to the dealership indicated by the invite
    and assigns the invited role. Does NOT create a new auth user.
    """
    try:
        token = payload.get("token")
        full_name = payload.get("full_name")
        phone = payload.get("phone")

        if not token:
            raise HTTPException(status_code=400, detail="Missing invite token")

        # Get the invite by token
        invite = await get_invite_by_token(session=db, token=token)
        if not invite:
            raise HTTPException(status_code=404, detail="Invalid or expired invite")

        # Check status and expiry
        from datetime import datetime
        if invite.status != "pending":
            raise HTTPException(status_code=400, detail="Invite has already been used or expired")
        if invite.expires_at and invite.expires_at < datetime.utcnow():
            await update_invite_status(session=db, invite_id=str(invite.id), status="expired")
            raise HTTPException(status_code=400, detail="Invite has expired")

        # Map role name for compatibility
        role_for_profile = invite.role
        if role_for_profile == 'admin':
            role_for_profile = 'owner'

        # Create or update user profile
        await create_user_profile(
            session=db,
            user_id=current_user_id,
            dealership_id=str(invite.dealership_id),
            full_name=full_name or "",
            phone=phone,
            role=role_for_profile,
            timezone="America/New_York"
        )

        # Assign role in role system (best effort)
        try:
            await RolesService.assign_user_role(
                db=db,
                user_id=current_user_id,
                dealership_id=str(invite.dealership_id),
                role_name=role_for_profile,
                assigned_by=str(invite.invited_by)
            )
        except Exception as e:
            logger.warning(f"Could not assign role in new system: {e}")

        # Mark invite as accepted
        await update_invite_status(
            session=db,
            invite_id=str(invite.id),
            status="accepted",
            used_at=datetime.utcnow()
        )

        return {"success": True, "message": "Invite completed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing invite: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete invite")

@router.delete("/invites/{invite_id}")
async def cancel_invite(
    invite_id: str,
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id)
):
    """
    Cancel an invite
    
    Requires manager or owner role.
    """
    # Check if user has permission to cancel invites
    logger.info(f"🔍 Checking delete permissions for user: {user_id}")
    current_user_profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    logger.info(f"🔍 User profile found: {current_user_profile is not None}")
    if current_user_profile:
        logger.info(f"🔍 User role: {current_user_profile.role}")
        logger.info(f"🔍 Role in allowed list: {current_user_profile.role in ['owner', 'manager']}")
    
    if not current_user_profile or current_user_profile.role not in ['owner', 'manager']:
        logger.error(f"❌ Permission denied for user {user_id} with role {current_user_profile.role if current_user_profile else 'None'}")
        raise HTTPException(
            status_code=403, 
            detail="You need manager or owner permissions to cancel invites"
        )
    
    # Get the invite
    from maqro_backend.crud import get_invite_by_id
    invite = await get_invite_by_id(session=db, invite_id=invite_id)
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.dealership_id != dealership_id:
        raise HTTPException(status_code=403, detail="You can only cancel invites for your dealership")
    
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending invites")
    
    # Cancel the invite
    await update_invite_status(session=db, invite_id=invite_id, status="cancelled")
    
    return {"success": True, "message": "Invite cancelled successfully"}
