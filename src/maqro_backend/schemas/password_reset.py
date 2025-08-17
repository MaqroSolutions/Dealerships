"""
Pydantic schemas for password reset functionality
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password endpoint"""
    email: EmailStr = Field(..., description="User's email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class ForgotPasswordResponse(BaseModel):
    """Response schema for forgot password endpoint"""
    message: str = Field(..., description="Success message (always generic)")
    success: bool = Field(True, description="Always true for security")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "If an account with that email exists, a password reset link has been sent.",
                "success": True
            }
        }


class ResetPasswordRequest(BaseModel):
    """Request schema for reset password endpoint"""
    token: str = Field(..., description="Password reset token from URL")
    password: str = Field(..., min_length=8, description="New password")
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one uppercase letter
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        # Check for at least one lowercase letter
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        # Check for at least one digit
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "password": "NewSecurePassword123!"
            }
        }


class ResetPasswordResponse(BaseModel):
    """Response schema for reset password endpoint"""
    message: str = Field(..., description="Success message")
    success: bool = Field(True, description="Always true on success")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Password has been reset successfully. You can now sign in with your new password.",
                "success": True
            }
        }


class PasswordResetTokenInfo(BaseModel):
    """Schema for password reset token information"""
    id: str
    created_at: datetime
    expires_at: datetime
    user_id: str
    used_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PasswordResetAuditLogEntry(BaseModel):
    """Schema for password reset audit log entries"""
    id: str
    created_at: datetime
    user_id: Optional[str] = None
    event_type: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    error_message: Optional[str] = None
    event_metadata: dict = {}
    
    class Config:
        from_attributes = True
