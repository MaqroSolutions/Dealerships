"""
Roles and permissions service for managing user access control
"""
import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..db.models import Role, UserRole, UserProfile, Dealership
from ..schemas.roles import (
    RoleResponse,
    UserRoleResponse,
    UserWithRoleResponse,
    DealershipUsersResponse
)

logger = logging.getLogger(__name__)


class RolesService:
    """Service for managing roles and permissions"""

    # Role hierarchy for permission checking
    ROLE_HIERARCHY = {
        "owner": 100,
        "manager": 80,
        "salesperson": 40
    }

    @staticmethod
    async def get_all_roles(db: AsyncSession) -> List[Role]:
        """Get all available roles"""
        result = await db.execute(select(Role))
        return result.scalars().all()

    @staticmethod
    async def get_role_by_name(db: AsyncSession, name: str) -> Optional[Role]:
        """Get a role by its name"""
        result = await db.execute(
            select(Role).where(Role.name == name)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_role(
        db: AsyncSession, 
        user_id: str, 
        dealership_id: str
    ) -> Optional[UserRole]:
        """Get a user's role at a specific dealership"""
        result = await db.execute(
            select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.dealership_id == dealership_id
            ).options(joinedload(UserRole.role))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_role_name(
        db: AsyncSession, 
        user_id: str, 
        dealership_id: str
    ) -> Optional[str]:
        """Get a user's role name at a specific dealership"""
        user_role = await RolesService.get_user_role(db, user_id, dealership_id)
        return user_role.role.name if user_role else None

    @staticmethod
    async def assign_user_role(
        db: AsyncSession,
        user_id: str,
        dealership_id: str,
        role_name: str,
        assigned_by: Optional[str] = None
    ) -> UserRole:
        """Assign a role to a user at a dealership"""
        
        # Validate role exists
        role = await RolesService.get_role_by_name(db, role_name)
        if not role:
            raise ValueError(f"Role '{role_name}' not found")

        # Check if user already has a role at this dealership
        existing_role = await RolesService.get_user_role(db, user_id, dealership_id)
        
        if existing_role:
            # Update existing role
            existing_role.role_id = role.id
            user_role = existing_role
        else:
            # Create new role assignment
            user_role = UserRole(
                user_id=user_id,
                dealership_id=dealership_id,
                role_id=role.id
            )
            db.add(user_role)

        await db.commit()
        await db.refresh(user_role)
        
        # Load the role relationship
        await db.refresh(user_role, ["role"])
        
        return user_role

    @staticmethod
    async def remove_user_role(
        db: AsyncSession,
        user_id: str,
        dealership_id: str
    ) -> bool:
        """Remove a user's role from a dealership"""
        user_role = await RolesService.get_user_role(db, user_id, dealership_id)
        
        if user_role:
            await db.delete(user_role)
            await db.commit()
            return True
        return False

    @staticmethod
    async def get_dealership_users_with_roles(
        db: AsyncSession,
        dealership_id: str
    ) -> List[UserWithRoleResponse]:
        """Get all users in a dealership with their roles"""
        result = await db.execute(
            select(UserProfile, UserRole, Role).join(
                UserRole, UserProfile.user_id == UserRole.user_id
            ).join(
                Role, UserRole.role_id == Role.id
            ).where(
                UserProfile.dealership_id == dealership_id,
                UserRole.dealership_id == dealership_id
            )
        )
        
        users_with_roles = []
        for user_profile, user_role, role in result:
            users_with_roles.append(UserWithRoleResponse(
                user_id=str(user_profile.user_id),
                dealership_id=str(user_profile.dealership_id),
                full_name=user_profile.full_name,
                phone=user_profile.phone,
                role=RoleResponse(
                    id=str(role.id),
                    name=role.name,
                    description=role.description,
                    created_at=role.created_at
                ),
                created_at=user_role.created_at
            ))
        
        return users_with_roles

    @staticmethod
    async def user_has_role_level(
        db: AsyncSession,
        user_id: str,
        dealership_id: str,
        required_role: str
    ) -> bool:
        """Check if user has at least the required role level"""
        user_role_name = await RolesService.get_user_role_name(db, user_id, dealership_id)
        
        if not user_role_name:
            return False
        
        user_level = RolesService.ROLE_HIERARCHY.get(user_role_name, 0)
        required_level = RolesService.ROLE_HIERARCHY.get(required_role, 100)
        
        return user_level >= required_level

    @staticmethod
    async def user_can_manage_settings(
        db: AsyncSession,
        user_id: str,
        dealership_id: str
    ) -> bool:
        """Check if user can manage dealership settings (manager or owner)"""
        return await RolesService.user_has_role_level(
            db, user_id, dealership_id, "manager"
        )

    @staticmethod
    async def user_can_assign_roles(
        db: AsyncSession,
        user_id: str,
        dealership_id: str
    ) -> bool:
        """Check if user can assign roles (owner only)"""
        return await RolesService.user_has_role_level(
            db, user_id, dealership_id, "owner"
        )

    @staticmethod
    async def user_can_manage_user(
        db: AsyncSession,
        manager_user_id: str,
        target_user_id: str,
        dealership_id: str
    ) -> bool:
        """Check if a user can manage another user (must have higher role level)"""
        
        manager_role = await RolesService.get_user_role_name(db, manager_user_id, dealership_id)
        target_role = await RolesService.get_user_role_name(db, target_user_id, dealership_id)
        
        if not manager_role or not target_role:
            return False
        
        manager_level = RolesService.ROLE_HIERARCHY.get(manager_role, 0)
        target_level = RolesService.ROLE_HIERARCHY.get(target_role, 0)
        
        return manager_level > target_level

    @staticmethod
    async def get_user_owned_dealerships(
        db: AsyncSession,
        user_id: str
    ) -> List[str]:
        """Get all dealership IDs where user has owner role (future multi-dealership support)"""
        result = await db.execute(
            select(UserRole.dealership_id).join(
                Role, UserRole.role_id == Role.id
            ).where(
                UserRole.user_id == user_id,
                Role.name == "owner"
            )
        )
        return [str(dealership_id) for dealership_id in result.scalars().all()]

    @staticmethod
    async def get_user_dealership_role_summary(
        db: AsyncSession,
        user_id: str
    ) -> List[dict]:
        """Get summary of user's roles across all dealerships"""
        result = await db.execute(
            select(UserRole, Role, Dealership).join(
                Role, UserRole.role_id == Role.id
            ).join(
                Dealership, UserRole.dealership_id == Dealership.id
            ).where(
                UserRole.user_id == user_id
            )
        )
        
        summary = []
        for user_role, role, dealership in result:
            summary.append({
                "dealership_id": str(dealership.id),
                "dealership_name": dealership.name,
                "role_name": role.name,
                "role_description": role.description,
                "assigned_at": user_role.created_at
            })
        
        return summary