"""
Roles and permissions API routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..deps import (
    get_db_session, 
    get_current_user_id, 
    get_user_dealership_id,
    require_dealership_owner,
    require_dealership_manager,
    get_user_role_info,

)
from ...services.roles_service import RolesService
from ...schemas.roles import (
    RoleResponse,
    UserRoleResponse,
    UserRoleCreate,
    UserRoleUpdate,
    UserWithRoleResponse,

)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/roles", response_model=list[RoleResponse])
async def get_available_roles(
    user_id: str = Depends(get_current_user_id),  # Require authentication
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all available system roles
    
    Returns the roles that can be assigned to users.
    """
    try:
        roles = await RolesService.get_all_roles(db)
        return [
            RoleResponse(
                id=str(role.id),
                name=role.name,
                description=role.description,
                created_at=role.created_at
            )
            for role in roles
        ]
    except Exception as e:
        logger.error(f"Error fetching roles: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching available roles")


@router.get("/roles/me")
async def get_my_role_info(
    user_info: tuple = Depends(get_user_role_info),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current user's role information
    
    Returns the user's role in their current dealership.
    """
    user_id, dealership_id, role_name = user_info
    
    try:
        # Get additional role details
        user_role = await RolesService.get_user_role(db, user_id, dealership_id)
        
        if not user_role:
            raise HTTPException(status_code=404, detail="Role assignment not found")
        
        return {
            "user_id": user_id,
            "dealership_id": dealership_id,
            "role": RoleResponse(
                id=str(user_role.role.id),
                name=user_role.role.name,
                description=user_role.role.description,
                created_at=user_role.role.created_at
            ),
            "assigned_at": user_role.created_at,
            "permissions": {
                "can_manage_settings": await RolesService.user_can_manage_settings(db, user_id, dealership_id),
                "can_assign_roles": await RolesService.user_can_assign_roles(db, user_id, dealership_id)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting role info for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting role information")


@router.get("/roles/users", response_model=list[UserWithRoleResponse])
async def get_dealership_users_with_roles(
    dealership_id: str = Depends(get_user_dealership_id),
    manager_user_id: str = Depends(require_dealership_manager),  # Permission check
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all users in the dealership with their roles
    
    Requires manager or owner role.
    Returns all users in the current dealership and their assigned roles.
    """
    try:
        users_with_roles = await RolesService.get_dealership_users_with_roles(db, dealership_id)
        return users_with_roles
    except Exception as e:
        logger.error(f"Error getting dealership users for {dealership_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting dealership users")


@router.post("/roles/assign", response_model=UserRoleResponse)
async def assign_user_role(
    role_assignment: UserRoleCreate,
    dealership_id: str = Depends(get_user_dealership_id),
    owner_user_id: str = Depends(require_dealership_owner),  # Permission check - owner only
    db: AsyncSession = Depends(get_db_session)
):
    """
    Assign a role to a user in the current dealership
    
    Requires owner role.
    Creates or updates a user's role assignment.
    """
    try:
        # Validate role name
        valid_roles = ["owner", "manager", "salesperson"]
        if role_assignment.role_name not in valid_roles:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        
        user_role = await RolesService.assign_user_role(
            db=db,
            user_id=role_assignment.user_id,
            dealership_id=dealership_id,
            role_name=role_assignment.role_name,
            assigned_by=owner_user_id
        )
        
        return UserRoleResponse(
            user_id=str(user_role.user_id),
            dealership_id=str(user_role.dealership_id),
            role_id=str(user_role.role_id),
            created_at=user_role.created_at,
            role=RoleResponse(
                id=str(user_role.role.id),
                name=user_role.role.name,
                description=user_role.role.description,
                created_at=user_role.role.created_at
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error assigning role {role_assignment.role_name} to user {role_assignment.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error assigning user role")


@router.put("/roles/users/{target_user_id}", response_model=UserRoleResponse)
async def update_user_role(
    target_user_id: str,
    role_update: UserRoleUpdate,
    dealership_id: str = Depends(get_user_dealership_id),
    owner_user_id: str = Depends(require_dealership_owner),  # Permission check - owner only
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update a user's role in the current dealership
    
    Requires owner role.
    Updates an existing user's role assignment.
    """
    try:
        # Validate role name
        valid_roles = ["owner", "manager", "salesperson"]
        if role_update.role_name not in valid_roles:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        
        # Check if user exists in dealership
        existing_role = await RolesService.get_user_role(db, target_user_id, dealership_id)
        if not existing_role:
            raise HTTPException(
                status_code=404, 
                detail="User not found in this dealership"
            )
        
        user_role = await RolesService.assign_user_role(
            db=db,
            user_id=target_user_id,
            dealership_id=dealership_id,
            role_name=role_update.role_name,
            assigned_by=owner_user_id
        )
        
        return UserRoleResponse(
            user_id=str(user_role.user_id),
            dealership_id=str(user_role.dealership_id),
            role_id=str(user_role.role_id),
            created_at=user_role.created_at,
            role=RoleResponse(
                id=str(user_role.role.id),
                name=user_role.role.name,
                description=user_role.role.description,
                created_at=user_role.role.created_at
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating role for user {target_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating user role")


@router.delete("/roles/users/{target_user_id}")
async def remove_user_role(
    target_user_id: str,
    dealership_id: str = Depends(get_user_dealership_id),
    owner_user_id: str = Depends(require_dealership_owner),  # Permission check - owner only
    db: AsyncSession = Depends(get_db_session)
):
    """
    Remove a user's role from the current dealership
    
    Requires owner role.
    This effectively removes the user from the dealership.
    """
    try:
        # Don't allow owners to remove themselves
        if target_user_id == owner_user_id:
            raise HTTPException(
                status_code=400, 
                detail="Cannot remove your own role. Transfer ownership first."
            )
        
        removed = await RolesService.remove_user_role(db, target_user_id, dealership_id)
        if not removed:
            raise HTTPException(status_code=404, detail="User role not found")
        
        return {
            "message": f"User role removed from dealership",
            "user_id": target_user_id,
            "dealership_id": dealership_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing role for user {target_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error removing user role")


@router.get("/roles/check-permission")
async def check_user_permission(
    required_role: str,
    user_id: str = Depends(get_current_user_id),
    dealership_id: str = Depends(get_user_dealership_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Check if current user has at least the specified role level
    
    Useful for frontend to determine what features to show.
    Required role can be: 'salesperson', 'manager', or 'owner'
    """
    try:
        valid_roles = ["salesperson", "manager", "owner"]
        if required_role not in valid_roles:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        
        has_permission = await RolesService.user_has_role_level(
            db, user_id, dealership_id, required_role
        )
        
        current_role = await RolesService.get_user_role_name(db, user_id, dealership_id)
        
        return {
            "user_id": user_id,
            "dealership_id": dealership_id,
            "current_role": current_role,
            "required_role": required_role,
            "has_permission": has_permission
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking permission for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking user permissions")


@router.get("/roles/summary")
async def get_user_role_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get summary of user's roles across all dealerships
    
    Future-proof for multi-dealership support.
    Shows all dealerships where the user has a role.
    """
    try:
        summary = await RolesService.get_user_dealership_role_summary(db, user_id)
        return {
            "user_id": user_id,
            "dealership_roles": summary,
            "total_dealerships": len(summary)
        }
    except Exception as e:
        logger.error(f"Error getting role summary for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting role summary")