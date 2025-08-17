"""
Settings API routes for hierarchical settings management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from ..deps import (
    get_db_session, 
    get_current_user_id, 
    get_user_dealership_id,
    require_dealership_manager,
    get_settings_service
)
from ...services.settings_service import SettingsService
from ...schemas.settings import (
    SettingDefinitionResponse,
    DealershipSettingResponse,
    DealershipSettingUpdate,
    UserSettingResponse,
    UserSettingUpdate,
    EffectiveSettingResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/settings/definitions", response_model=List[SettingDefinitionResponse])
async def get_setting_definitions(
    db: AsyncSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id)  # Require authentication
):
    """
    Get all available setting definitions
    
    This endpoint shows what settings are available for configuration.
    """
    try:
        definitions = await SettingsService.get_all_setting_definitions(db)
        return [
            SettingDefinitionResponse(
                key=definition.key,
                data_type=definition.data_type,
                description=definition.description,
                default_value=definition.default_value,
                allowed_values=definition.allowed_values,
                is_dealership_level=definition.is_dealership_level,
                is_user_level=definition.is_user_level,
                created_at=definition.created_at
            )
            for definition in definitions
        ]
    except Exception as e:
        logger.error(f"Error fetching setting definitions: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching setting definitions")


@router.get("/settings/user/{setting_key}")
async def get_user_setting(
    setting_key: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get effective setting value for the current user
    
    Returns the resolved setting value following the hierarchy:
    user setting → dealership setting → default value
    """
    try:
        value = await SettingsService.get_user_setting(db, user_id, setting_key)
        return {"key": setting_key, "value": value}
    except Exception as e:
        logger.error(f"Error getting setting {setting_key} for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting setting {setting_key}")


@router.get("/settings/user/{setting_key}/detailed", response_model=EffectiveSettingResponse)
async def get_user_setting_detailed(
    setting_key: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get detailed setting information including source
    
    Returns the setting value along with information about where it came from
    (user override, dealership setting, or default value).
    """
    try:
        return await SettingsService.get_user_setting_with_source(db, user_id, setting_key)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting detailed setting {setting_key} for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting setting details")


@router.put("/settings/user", response_model=UserSettingResponse)
async def update_user_setting(
    setting_update: UserSettingUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update a user's personal setting
    
    This creates or updates a user-level setting that overrides 
    dealership and default values for this specific user.
    """
    try:
        setting = await SettingsService.update_user_setting(
            db=db,
            user_id=user_id,
            key=setting_update.setting_key,
            value=setting_update.setting_value,
            updated_by=user_id
        )
        
        return UserSettingResponse(
            user_id=str(setting.user_id),
            setting_key=setting.setting_key,
            setting_value=setting.setting_value,
            created_at=setting.created_at,
            updated_at=setting.updated_at,
            updated_by=str(setting.updated_by) if setting.updated_by else None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating user setting {setting_update.setting_key}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating user setting")


@router.get("/settings/user", response_model=List[UserSettingResponse])
async def get_my_user_settings(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all personal settings for the current user
    
    Returns only the settings that the user has explicitly overridden.
    """
    try:
        settings = await SettingsService.get_user_settings(db, user_id)
        return [
            UserSettingResponse(
                user_id=str(setting.user_id),
                setting_key=setting.setting_key,
                setting_value=setting.setting_value,
                created_at=setting.created_at,
                updated_at=setting.updated_at,
                updated_by=str(setting.updated_by) if setting.updated_by else None
            )
            for setting in settings
        ]
    except Exception as e:
        logger.error(f"Error getting user settings for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting user settings")


@router.delete("/settings/user/{setting_key}")
async def delete_user_setting(
    setting_key: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Delete a user's personal setting override
    
    This removes the user-level setting, causing the user to inherit
    the dealership or default value for this setting.
    """
    try:
        deleted = await SettingsService.delete_user_setting(db, user_id, setting_key)
        if not deleted:
            raise HTTPException(status_code=404, detail="User setting not found")
        
        return {"message": f"Setting {setting_key} removed", "setting_key": setting_key}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user setting {setting_key}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting user setting")


# Dealership settings endpoints (require manager+ permissions)

@router.get("/settings/dealership", response_model=List[DealershipSettingResponse])
async def get_dealership_settings(
    dealership_id: str = Depends(get_user_dealership_id),
    manager_user_id: str = Depends(require_dealership_manager),  # Permission check
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all dealership-level settings
    
    Requires manager or owner role.
    Returns all settings configured at the dealership level.
    """
    try:
        settings = await SettingsService.get_dealership_settings(db, dealership_id)
        return [
            DealershipSettingResponse(
                dealership_id=str(setting.dealership_id),
                setting_key=setting.setting_key,
                setting_value=setting.setting_value,
                created_at=setting.created_at,
                updated_at=setting.updated_at,
                updated_by=str(setting.updated_by) if setting.updated_by else None
            )
            for setting in settings
        ]
    except Exception as e:
        logger.error(f"Error getting dealership settings for {dealership_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting dealership settings")


@router.put("/settings/dealership", response_model=DealershipSettingResponse)
async def update_dealership_setting(
    setting_update: DealershipSettingUpdate,
    dealership_id: str = Depends(get_user_dealership_id),
    manager_user_id: str = Depends(require_dealership_manager),  # Permission check
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update a dealership-level setting
    
    Requires manager or owner role.
    This affects all users in the dealership who haven't overridden this setting.
    """
    try:
        setting = await SettingsService.update_dealership_setting(
            db=db,
            dealership_id=dealership_id,
            key=setting_update.setting_key,
            value=setting_update.setting_value,
            updated_by=manager_user_id
        )
        
        return DealershipSettingResponse(
            dealership_id=str(setting.dealership_id),
            setting_key=setting.setting_key,
            setting_value=setting.setting_value,
            created_at=setting.created_at,
            updated_at=setting.updated_at,
            updated_by=str(setting.updated_by) if setting.updated_by else None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating dealership setting {setting_update.setting_key}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating dealership setting")


@router.get("/settings/effective/{setting_key}")
async def get_effective_setting_for_dealership(
    setting_key: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get the effective setting value with inheritance information
    
    Shows how a setting resolves for the current user, including which level
    (user, dealership, or default) provides the value.
    """
    try:
        result = await SettingsService.get_user_setting_with_source(db, user_id, setting_key)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting effective setting {setting_key}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting effective setting")