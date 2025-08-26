"""
User Profile API routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from maqro_backend.api.deps import get_db_session, get_current_user_id, get_user_dealership_id, require_dealership_manager
from maqro_backend.schemas.user_profile import (
    UserProfileCreate, 
    UserProfileResponse, 
    UserProfileUpdate,
    UserProfileWithRoleResponse,
    UserProfileLegacyResponse
)
from maqro_backend.services.roles_service import RolesService
from maqro_backend.schemas.roles import RoleResponse
from maqro_backend.crud import (
    create_user_profile,
    get_user_profile_by_user_id,
    get_user_profiles_by_dealership,
    update_user_profile
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/user-profiles", response_model=UserProfileResponse)
async def create_new_user_profile(
    profile_data: UserProfileCreate,
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new user profile
    
    Note: Typically called during user registration/onboarding
    """
    logger.info(f"Creating user profile for user: {user_id}")
    
    # Check if profile already exists
    existing_profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    if existing_profile:
        raise HTTPException(status_code=400, detail="User profile already exists")
    
    profile = await create_user_profile(
        session=db,
        user_id=user_id,
        dealership_id=profile_data.dealership_id,
        full_name=profile_data.full_name,
        phone=profile_data.phone,
        role=profile_data.role or 'salesperson',  # Default to salesperson for MVP
        timezone=profile_data.timezone
    )
    
    logger.info(f"User profile created with ID: {profile.id}")
    
    return UserProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        dealership_id=str(profile.dealership_id) if profile.dealership_id else None,
        full_name=profile.full_name,
        phone=profile.phone,
        role=profile.role,
        timezone=profile.timezone,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.get("/user-profiles/me", response_model=UserProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Get the current user's profile
    """
    profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return UserProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        dealership_id=str(profile.dealership_id) if profile.dealership_id else None,
        full_name=profile.full_name,
        phone=profile.phone,
        role=profile.role,
        timezone=profile.timezone,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put("/user-profiles/me", response_model=UserProfileResponse)
async def update_my_profile(
    profile_update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Update the current user's profile
    """
    update_data = profile_update.model_dump(exclude_unset=True)
    
    profile = await update_user_profile(
        session=db,
        user_id=user_id,
        **update_data
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return UserProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        dealership_id=str(profile.dealership_id) if profile.dealership_id else None,
        full_name=profile.full_name,
        phone=profile.phone,
        role=profile.role,
        timezone=profile.timezone,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.get("/user-profiles/me/with-role", response_model=UserProfileWithRoleResponse)
async def get_my_profile_with_role(
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id)
):
    """
    Get the current user's profile with role information
    
    Returns enhanced profile data including the user's role in the current dealership.
    """
    # Get basic profile
    profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Get role information
    try:
        user_role = await RolesService.get_user_role(db, user_id, dealership_id)
        
        role_info = None
        role_name = None
        
        if user_role:
            role_info = RoleResponse(
                id=str(user_role.role.id),
                name=user_role.role.name,
                description=user_role.role.description,
                created_at=user_role.role.created_at
            )
            role_name = user_role.role.name
            
    except Exception as e:
        logger.warning(f"Failed to get role info for user {user_id}: {str(e)}")
        role_info = None
        role_name = None
    
    return UserProfileWithRoleResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        dealership_id=str(profile.dealership_id) if profile.dealership_id else None,
        full_name=profile.full_name,
        phone=profile.phone,
        timezone=profile.timezone,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        role=role_info,
        role_name=role_name
    )


@router.get("/user-profiles/dealership", response_model=List[UserProfileResponse])
async def get_dealership_user_profiles(
    db: AsyncSession = Depends(get_db_session),
    dealership_id: str = Depends(get_user_dealership_id),
    user_id: str = Depends(get_current_user_id)  # Simplified permission check
):
    """
    Get all user profiles for the current dealership
    
    Requires manager or owner role.
    Returns all user profiles in the dealership.
    """
    # Simple permission check: get current user's profile and check role
    current_user_profile = await get_user_profile_by_user_id(session=db, user_id=user_id)
    if not current_user_profile or current_user_profile.role not in ['owner', 'manager']:
        raise HTTPException(status_code=403, detail="Insufficient permissions. Owner or manager role required.")
    
    profiles = await get_user_profiles_by_dealership(session=db, dealership_id=dealership_id)
    
    return [
        UserProfileResponse(
            id=str(profile.id),
            user_id=str(profile.user_id),
            dealership_id=str(profile.dealership_id) if profile.dealership_id else None,
            full_name=profile.full_name,
            phone=profile.phone,
            role=profile.role,
            timezone=profile.timezone,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        ) for profile in profiles
    ]