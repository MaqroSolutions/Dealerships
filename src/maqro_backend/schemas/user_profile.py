"""
User profile schemas for Supabase integration
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from .roles import RoleResponse


class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    timezone: str = "America/New_York"


class UserProfileCreate(UserProfileBase):
    """Data structure for creating a new user profile"""
    dealership_id: Optional[str] = None  # UUID as string


class UserProfileUpdate(BaseModel):
    """Update model for user profiles"""
    dealership_id: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None


class UserProfileResponse(UserProfileBase):
    """Response model for user profiles (Supabase compatible)"""
    id: str = Field(..., description="UUID as string")
    user_id: str = Field(..., description="User UUID as string")
    dealership_id: Optional[str] = Field(None, description="Dealership UUID as string")
    created_at: datetime
    updated_at: datetime
    model_config = {
        "from_attributes": True
    }


class UserProfileWithRoleResponse(UserProfileResponse):
    """User profile response that includes role information"""
    role: Optional[RoleResponse] = None
    role_name: Optional[str] = None  # Convenience field for the role name


class UserProfileLegacyResponse(UserProfileBase):
    """Legacy response model that includes the old text role field for backward compatibility"""
    id: str = Field(..., description="UUID as string")
    user_id: str = Field(..., description="User UUID as string")
    dealership_id: Optional[str] = Field(None, description="Dealership UUID as string")
    role: Optional[str] = None  # Legacy text role field
    created_at: datetime
    updated_at: datetime
    model_config = {
        "from_attributes": True
    }