"""
Settings schemas for API validation
"""
from pydantic import BaseModel, Field
from typing import Any, Optional
from datetime import datetime


class SettingDefinitionResponse(BaseModel):
    """Response model for setting definitions"""
    key: str
    data_type: str
    description: Optional[str] = None
    default_value: Optional[Any] = None
    allowed_values: Optional[list] = None
    is_dealership_level: bool = True
    is_user_level: bool = True
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class DealershipSettingResponse(BaseModel):
    """Response model for dealership settings"""
    dealership_id: str = Field(..., description="Dealership UUID as string")
    setting_key: str
    setting_value: Any
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[str] = None
    
    model_config = {
        "from_attributes": True
    }


class DealershipSettingUpdate(BaseModel):
    """Update model for dealership settings"""
    setting_key: str = Field(..., description="Setting key to update")
    setting_value: Any = Field(..., description="New setting value")


class DealershipSettingCreate(BaseModel):
    """Create model for dealership settings"""
    setting_key: str = Field(..., description="Setting key")
    setting_value: Any = Field(..., description="Setting value")


class UserSettingResponse(BaseModel):
    """Response model for user settings"""
    user_id: str = Field(..., description="User UUID as string")
    setting_key: str
    setting_value: Any
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[str] = None
    
    model_config = {
        "from_attributes": True
    }


class UserSettingUpdate(BaseModel):
    """Update model for user settings"""
    setting_key: str = Field(..., description="Setting key to update")
    setting_value: Any = Field(..., description="New setting value")


class UserSettingCreate(BaseModel):
    """Create model for user settings"""
    setting_key: str = Field(..., description="Setting key")
    setting_value: Any = Field(..., description="Setting value")


class EffectiveSettingResponse(BaseModel):
    """Response model for resolved setting values"""
    key: str
    value: Any
    source: str = Field(..., description="Source of the setting: 'user', 'dealership', or 'default'")
    data_type: str
    description: Optional[str] = None


class SettingsValidationError(BaseModel):
    """Error model for settings validation"""
    setting_key: str
    error_message: str
    current_value: Optional[Any] = None
    allowed_values: Optional[list] = None