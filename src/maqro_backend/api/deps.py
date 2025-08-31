from typing import Annotated, Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from maqro_rag import EnhancedRAGService
from ..db.session import get_db
from ..core.lifespan import get_enhanced_rag_service
from ..db.models import UserProfile
from ..services.roles_service import RolesService
from ..services.settings_service import SettingsService
from .auth import get_current_user_id, get_optional_user_id
import logging
import uuid

logger = logging.getLogger(__name__)


# Re-export for easy importing
get_db_session = get_db
get_enhanced_rag_services = get_enhanced_rag_service


async def get_user_dealership_id(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> str:
    """
    Extract user's dealership ID from their profile.
    
    This function gets the user ID from the JWT token and then looks up
    their dealership_id from the user_profiles table.
    
    Args:
        user_id: User ID from JWT token (via get_current_user_id dependency)
        db: Database session
        
    Returns:
        str: Dealership ID (UUID) from user's profile
        
    Raises:
        HTTPException: If user profile is missing or dealership_id is null
    """
    logger.info("🏢 Fetching user's dealership ID from profile")
    
    # Look up their profile to get dealership_id
    try:
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(
            select(UserProfile.dealership_id)
            .where(UserProfile.user_id == user_uuid)
        )
        dealership_id = result.scalar_one_or_none()
        
        if not dealership_id:
            logger.error(f"❌ No dealership found for user {user_id}")
            raise HTTPException(
                status_code=403, 
                detail="User profile not found or not associated with a dealership"
            )
        
        logger.info(f"✅ Found dealership ID: {dealership_id} for user: {user_id}")
        return str(dealership_id)
        
    except ValueError:
        logger.error(f"❌ Invalid user ID format: {user_id}")
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except Exception as e:
        logger.error(f"❌ Database error fetching dealership for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error fetching user dealership information"
        )


async def get_optional_user_dealership_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db_session)
) -> Optional[str]:
    """
    Extract user's dealership ID from their profile, returns None if no token provided.
    
    This is useful for endpoints that can work with or without authentication.
    
    Args:
        credentials: Optional HTTP credentials
        db: Database session
        
    Returns:
        Optional[str]: Dealership ID if valid token provided, None otherwise
    """
    if not credentials or credentials.scheme != "Bearer":
        return None
        
    try:
        user_id = await get_optional_user_id(credentials)
        if not user_id:
            return None
            
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(
            select(UserProfile.dealership_id)
            .where(UserProfile.user_id == user_uuid)
        )
        dealership_id = result.scalar_one_or_none()
        return str(dealership_id) if dealership_id else None
        
    except Exception:
        return None


# Re-export secure authentication functions from auth module
# These replace the old insecure header-based authentication
# get_current_user_id and get_optional_user_id are now imported from .auth


# New permission-based dependencies for settings system
async def require_dealership_manager(
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id),
    db: AsyncSession = Depends(get_db_session)
) -> str:
    """
    Dependency that requires manager or owner role for dealership operations.
    
    Returns:
        str: User ID if user has sufficient permissions
        
    Raises:
        HTTPException: If user doesn't have manager+ permissions
    """
    has_permission = await RolesService.user_can_manage_settings(
        db, user_id, dealership_id
    )
    
    if not has_permission:
        logger.warning(f"❌ User {user_id} denied manager access to dealership {dealership_id}")
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions. Manager or owner role required."
        )
    
    logger.info(f"✅ User {user_id} granted manager access to dealership {dealership_id}")
    return user_id


async def require_dealership_owner(
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id),
    db: AsyncSession = Depends(get_db_session)
) -> str:
    """
    Dependency that requires owner role for sensitive operations.
    
    Returns:
        str: User ID if user has owner permissions
        
    Raises:
        HTTPException: If user doesn't have owner permissions
    """
    has_permission = await RolesService.user_can_assign_roles(
        db, user_id, dealership_id
    )
    
    if not has_permission:
        logger.warning(f"❌ User {user_id} denied owner access to dealership {dealership_id}")
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions. Owner role required."
        )
    
    logger.info(f"✅ User {user_id} granted owner access to dealership {dealership_id}")
    return user_id


async def get_user_role_info(
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id),
    db: AsyncSession = Depends(get_db_session)
) -> tuple[str, str, str]:
    """
    Get user role information for the current dealership.
    
    Returns:
        tuple[str, str, str]: (user_id, dealership_id, role_name)
        
    Raises:
        HTTPException: If user has no role in the dealership
    """
    role_name = await RolesService.get_user_role_name(db, user_id, dealership_id)
    
    if not role_name:
        logger.error(f"❌ User {user_id} has no role in dealership {dealership_id}")
        raise HTTPException(
            status_code=403,
            detail="User has no role assigned in this dealership"
        )
    
    return user_id, dealership_id, role_name


# Service dependencies
async def get_settings_service() -> SettingsService:
    """Dependency to get settings service instance"""
    return SettingsService()


async def get_roles_service() -> RolesService:
    """Dependency to get roles service instance"""
    return RolesService()