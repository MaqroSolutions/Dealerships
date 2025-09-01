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
    InviteListResponse,
    SendInviteEmailRequest
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
        from datetime import datetime, timezone
        if invite.status != "pending":
            return {"valid": False, "reason": "Invite already used or cancelled"}
        if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
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
        requested_role = invite_data.role_name
        allowed_roles = ['salesperson', 'manager']

        if requested_role not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role: {requested_role}. Allowed roles are: {', '.join(allowed_roles)}"
            )
        
        invite = await create_invite(
            session=db,
            dealership_id=dealership_id,
            email=invite_data.email,
            role_name=requested_role,
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

        logger.info(f"📧 Invite created successfully for {invite.email}. Token: {invite.token_hash}")

        return invite_response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating invite: {e}")
        raise HTTPException(status_code=500, detail="Failed to create invite")


@router.post("/send-invite-email")
async def send_invite_email(
    request: SendInviteEmailRequest,
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Send invite email via Resend
    
    Requires manager or owner role.
    """
    logger.info(f"Sending invite email to: {request.email}")
    
    # Check if user has permission to send invites (manager or owner)
    current_user_profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    if not current_user_profile or current_user_profile.role not in ['owner', 'manager']:
        raise HTTPException(
            status_code=403, 
            detail="You need manager or owner permissions to send invite emails"
        )
    
    try:
        # Import ResendEmailService
        from maqro_backend.services.email_service import ResendEmailService
        
        # Get invite details to extract dealership and role info
        invite = await get_invite_by_token(session=db, token=request.token)
        if not invite:
            raise HTTPException(status_code=404, detail="Invalid invite token")
        
        # Get dealership name
        from maqro_backend.db.models import Dealership
        from sqlalchemy import select
        dealership_result = await db.execute(
            select(Dealership.name).where(Dealership.id == invite.dealership_id)
        )
        dealership_name = dealership_result.scalar_one_or_none() or "Unknown Dealership"
        
        # Build invite link
        frontend_base = settings.frontend_base_url or "http://localhost:3000"
        invite_link = f"{frontend_base}/signup?token={request.token}"
        
        # Send email via Resend
        email_service = ResendEmailService()
        result = await email_service.send_invite_email(
            email=request.email,
            invite_link=invite_link,
            dealership_name=dealership_name,
            role_name=invite.role,
            inviter_name=current_user_profile.full_name
        )
        
        if result["success"]:
            logger.info(f"📧 Invite email sent successfully to {request.email} via Resend")
        else:
            logger.error(f"❌ Failed to send invite email: {result.get('error')}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending invite email: {e}")
        return {
            "success": False,
            "error": str(e)
        }


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
            status=invite.status,
            token=invite.token_hash
        ) for invite in invites
    ]



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
        from datetime import datetime, timezone
        if invite.status != "pending":
            raise HTTPException(status_code=400, detail="Invite has already been used or expired")
        if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
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

        # Role is already assigned via user_profile creation above
        # No need for separate role system - using schema constraints
        
        # Mark invite as accepted
        await update_invite_status(
            session=db,
            invite_id=str(invite.id),
            status="accepted",
            used_at=datetime.now(timezone.utc)
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
