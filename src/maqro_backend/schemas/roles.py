"""
Role and permission schemas for API validation
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RoleBase(BaseModel):
    """Base role model"""
    name: str = Field(..., description="Role name")
    description: Optional[str] = None


class RoleResponse(BaseModel):
    """Response model for roles"""
    id: str = Field(..., description="Role UUID as string")
    name: str
    description: Optional[str] = None
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class UserRoleBase(BaseModel):
    """Base user role assignment model"""
    user_id: str = Field(..., description="User UUID as string")
    dealership_id: str = Field(..., description="Dealership UUID as string")
    role_id: str = Field(..., description="Role UUID as string")


class UserRoleResponse(BaseModel):
    """Response model for user role assignments"""
    user_id: str = Field(..., description="User UUID as string")
    dealership_id: str = Field(..., description="Dealership UUID as string")
    role_id: str = Field(..., description="Role UUID as string")
    created_at: datetime
    role: RoleResponse
    
    model_config = {
        "from_attributes": True
    }


class UserRoleCreate(BaseModel):
    """Create model for user role assignments"""
    user_id: str = Field(..., description="User UUID as string")
    role_name: str = Field(..., description="Role name (owner, manager, salesperson)")


class UserRoleUpdate(BaseModel):
    """Update model for user role assignments"""
    role_name: str = Field(..., description="New role name (owner, manager, salesperson)")


class UserWithRoleResponse(BaseModel):
    """Response model for user with their role information"""
    user_id: str = Field(..., description="User UUID as string")
    dealership_id: str = Field(..., description="Dealership UUID as string")
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: RoleResponse
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class DealershipUsersResponse(BaseModel):
    """Response model for all users in a dealership with their roles"""
    dealership_id: str = Field(..., description="Dealership UUID as string")
    dealership_name: str
    users: list[UserWithRoleResponse]


class RolePermissionCheck(BaseModel):
    """Model for checking role permissions"""
    user_id: str = Field(..., description="User UUID as string")
    dealership_id: str = Field(..., description="Dealership UUID as string")
    required_role: str = Field(..., description="Required role level")
    has_permission: bool = Field(..., description="Whether user has the required permission")