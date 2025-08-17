"""
Invite schemas for salesperson invitations
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class InviteCreate(BaseModel):
    """Schema for creating a new invite"""
    email: EmailStr
    role_name: str  # 'owner', 'manager', 'salesperson'
    expires_in_days: Optional[int] = 7


class InviteResponse(BaseModel):
    """Schema for invite response"""
    id: str
    dealership_id: str
    email: str
    token: str
    role_name: str
    invited_by: str
    created_at: datetime
    expires_at: datetime
    status: str

    class Config:
        from_attributes = True


class InviteAccept(BaseModel):
    """Schema for accepting an invite"""
    token: str
    full_name: str
    password: str
    phone: Optional[str] = None


class InviteListResponse(BaseModel):
    """Schema for listing invites"""
    id: str
    email: str
    role_name: str
    invited_by: str
    created_at: datetime
    expires_at: datetime
    status: str

    class Config:
        from_attributes = True
