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
    create_user_profile,
    assign_user_role
)
from maqro_backend.services.roles_service import RolesService
from maqro_backend.utils.role_compatibility import user_has_role_level

logger = logging.getLogger(__name__)

router = APIRouter()


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
    
    # Check if user has permission to create invites
    has_permission = await user_has_role_level(
        db, user_id, dealership_id, "manager"
    )
    
    if not has_permission:
        raise HTTPException(
            status_code=403, 
            detail="You need manager or owner permissions to create invites"
        )
    
    try:
        invite = await create_invite(
            session=db,
            dealership_id=dealership_id,
            email=invite_data.email,
            role_name=invite_data.role_name,
            invited_by=user_id,
            expires_in_days=invite_data.expires_in_days
        )
        
        logger.info(f"Invite created with ID: {invite.id}")
        
        return InviteResponse(
            id=str(invite.id),
            dealership_id=str(invite.dealership_id),
            email=invite.email,
            token=invite.token,
            role_name=invite.role_name,
            invited_by=str(invite.invited_by),
            created_at=invite.created_at,
            expires_at=invite.expires_at,
            status=invite.status
        )
        
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
    has_permission = await user_has_role_level(
        db, user_id, dealership_id, "manager"
    )
    
    if not has_permission:
        raise HTTPException(
            status_code=403, 
            detail="You need manager or owner permissions to view invites"
        )
    
    invites = await get_invites_by_dealership(session=db, dealership_id=dealership_id)
    
    return [
        InviteListResponse(
            id=str(invite.id),
            email=invite.email,
            role_name=invite.role_name,
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
        role_for_profile = invite.role_name
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
    has_permission = await user_has_role_level(
        db, user_id, dealership_id, "manager"
    )
    
    if not has_permission:
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
