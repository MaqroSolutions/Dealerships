"""
Role compatibility utilities for handling both old and new role systems
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from ..db.models import UserProfile, UserRole, Role


async def get_user_role_name(
    session: AsyncSession, 
    user_id: str, 
    dealership_id: str
) -> Optional[str]:
    """
    Get user's role name, compatible with both old and new role systems
    
    Returns:
        Role name: 'owner', 'manager', 'salesperson', or None if not found
    """
    try:
        # Try new role system first
        result = await session.execute(
            select(Role.name)
            .join(UserRole, Role.id == UserRole.role_id)
            .where(
                UserRole.user_id == user_id,
                UserRole.dealership_id == dealership_id
            )
        )
        role_name = result.scalar_one_or_none()
        
        if role_name:
            return role_name
        
        # Fallback to old role system
        result = await session.execute(
            select(UserProfile.role)
            .where(
                UserProfile.user_id == user_id,
                UserProfile.dealership_id == dealership_id
            )
        )
        old_role = result.scalar_one_or_none()
        
        if old_role:
            # Map old role names to new ones
            if old_role == 'admin':
                return 'owner'
            return old_role
        
        return None
        
    except Exception:
        return None


async def user_has_role_level(
    session: AsyncSession,
    user_id: str,
    dealership_id: str,
    required_role: str
) -> bool:
    """
    Check if user has at least the required role level, compatible with both systems
    
    Args:
        session: Database session
        user_id: User ID
        dealership_id: Dealership ID
        required_role: Required role level ('owner', 'manager', 'salesperson')
    
    Returns:
        True if user has sufficient permissions
    """
    user_role = await get_user_role_name(session, user_id, dealership_id)
    
    if not user_role:
        return False
    
    # Role hierarchy
    hierarchy = {
        "salesperson": 40,
        "manager": 80,
        "owner": 100
    }
    
    current_level = hierarchy.get(user_role, 0)
    required_level = hierarchy.get(required_role, 100)
    
    return current_level >= required_level


def map_role_name(role_name: str) -> str:
    """
    Map role names for consistency between old and new systems
    
    Args:
        role_name: Original role name
    
    Returns:
        Mapped role name
    """
    if role_name == 'admin':
        return 'owner'
    return role_name
