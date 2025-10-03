"""
Settings service for managing hierarchical settings (user → dealership → default)
"""
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload

from ..db.models import (
    SettingDefinition, 
    DealershipSetting, 
    UserSetting,
    UserProfile
)
from ..schemas.settings import (
    SettingDefinitionResponse,
    DealershipSettingResponse,
    UserSettingResponse,
    EffectiveSettingResponse
)

logger = logging.getLogger(__name__)


class SettingsService:
    """Service for managing settings across the hierarchy"""

    @staticmethod
    async def get_setting_definition(db: AsyncSession, key: str) -> Optional[SettingDefinition]:
        """Get a setting definition by key"""
        result = await db.execute(
            select(SettingDefinition).where(SettingDefinition.setting_key == key)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_setting_definitions(db: AsyncSession) -> List[SettingDefinition]:
        """Get all setting definitions"""
        result = await db.execute(select(SettingDefinition))
        return result.scalars().all()

    @staticmethod
    async def get_user_setting(db: AsyncSession, user_id: str, key: str) -> Any:
        """
        Get effective setting value for a user (user → dealership → default)
        Uses the database function for optimal performance
        """
        try:
            result = await db.execute(
                text("SELECT get_setting(:user_id, :key)"),
                {"user_id": user_id, "key": key}
            )
            value = result.scalar()
            
            # If the function returns null, try to get the default
            if value is None:
                definition = await SettingsService.get_setting_definition(db, key)
                return definition.default_value if definition else None
            
            return value
            
        except Exception as e:
            logger.error(f"Error getting setting {key} for user {user_id}: {str(e)}")
            # Fallback to default value
            definition = await SettingsService.get_setting_definition(db, key)
            return definition.default_value if definition else None

    @staticmethod
    async def get_user_setting_with_source(
        db: AsyncSession, 
        user_id: str, 
        key: str
    ) -> EffectiveSettingResponse:
        """Get setting value with information about where it came from"""
        
        # Check user-level setting first
        user_result = await db.execute(
            select(UserSetting).where(
                UserSetting.user_id == user_id,
                UserSetting.setting_key == key
            )
        )
        user_setting = user_result.scalar_one_or_none()
        
        if user_setting:
            definition = await SettingsService.get_setting_definition(db, key)
            return EffectiveSettingResponse(
                key=key,
                value=user_setting.setting_value,
                source="user",
                data_type=definition.data_type if definition else "unknown",
                description=definition.description if definition else None
            )

        # Check dealership-level setting
        dealership_result = await db.execute(
            select(DealershipSetting, UserProfile.dealership_id).join(
                UserProfile, UserProfile.dealership_id == DealershipSetting.dealership_id
            ).where(
                UserProfile.user_id == user_id,
                DealershipSetting.setting_key == key
            )
        )
        dealership_setting = dealership_result.first()
        
        if dealership_setting:
            definition = await SettingsService.get_setting_definition(db, key)
            return EffectiveSettingResponse(
                key=key,
                value=dealership_setting[0].setting_value,
                source="dealership",
                data_type=definition.data_type if definition else "unknown",
                description=definition.description if definition else None
            )

        # Use default value
        definition = await SettingsService.get_setting_definition(db, key)
        if definition:
            return EffectiveSettingResponse(
                key=key,
                value=definition.default_value,
                source="default",
                data_type=definition.data_type,
                description=definition.description
            )
        
        raise ValueError(f"Setting definition not found for key: {key}")

    @staticmethod
    async def update_user_setting(
        db: AsyncSession,
        user_id: str,
        key: str,
        value: Any,
        updated_by: Optional[str] = None
    ) -> UserSetting:
        """Update or create a user setting"""
        
        # Validate the setting exists and value is valid
        definition = await SettingsService.get_setting_definition(db, key)
        if not definition:
            raise ValueError(f"Setting definition not found: {key}")
        
        if not definition.is_user_level:
            raise ValueError(f"Setting {key} is not user-configurable")

        # Validation is handled by database triggers, but we can add additional checks here
        await SettingsService._validate_setting_value(definition, value)

        # Check if setting exists
        result = await db.execute(
            select(UserSetting).where(
                UserSetting.user_id == user_id,
                UserSetting.setting_key == key
            )
        )
        existing_setting = result.scalar_one_or_none()

        if existing_setting:
            existing_setting.setting_value = value
            existing_setting.updated_by = updated_by
            setting = existing_setting
        else:
            setting = UserSetting(
                user_id=user_id,
                setting_key=key,
                setting_value=value,
                updated_by=updated_by
            )
            db.add(setting)

        await db.commit()
        await db.refresh(setting)
        return setting

    @staticmethod
    async def update_dealership_setting(
        db: AsyncSession,
        dealership_id: str,
        key: str,
        value: Any,
        updated_by: str
    ) -> DealershipSetting:
        """Update or create a dealership setting"""
        
        # Validate the setting exists and value is valid
        definition = await SettingsService.get_setting_definition(db, key)
        if not definition:
            raise ValueError(f"Setting definition not found: {key}")
        
        if not definition.is_dealership_level:
            raise ValueError(f"Setting {key} is not dealership-configurable")

        # Validation is handled by database triggers
        await SettingsService._validate_setting_value(definition, value)

        # Check if setting exists
        result = await db.execute(
            select(DealershipSetting).where(
                DealershipSetting.dealership_id == dealership_id,
                DealershipSetting.setting_key == key
            )
        )
        existing_setting = result.scalar_one_or_none()

        if existing_setting:
            existing_setting.setting_value = value
            existing_setting.updated_by = updated_by
            setting = existing_setting
        else:
            setting = DealershipSetting(
                dealership_id=dealership_id,
                setting_key=key,
                setting_value=value,
                updated_by=updated_by
            )
            db.add(setting)

        await db.commit()
        await db.refresh(setting)
        return setting

    @staticmethod
    async def get_dealership_settings(
        db: AsyncSession, 
        dealership_id: str
    ) -> List[DealershipSetting]:
        """Get all settings for a dealership"""
        result = await db.execute(
            select(DealershipSetting).where(
                DealershipSetting.dealership_id == dealership_id
            ).options(joinedload(DealershipSetting.definition))
        )
        return result.scalars().all()

    @staticmethod
    async def get_user_settings(
        db: AsyncSession, 
        user_id: str
    ) -> List[UserSetting]:
        """Get all personal settings for a user"""
        result = await db.execute(
            select(UserSetting).where(
                UserSetting.user_id == user_id
            ).options(joinedload(UserSetting.definition))
        )
        return result.scalars().all()

    @staticmethod
    async def delete_user_setting(db: AsyncSession, user_id: str, key: str) -> bool:
        """Delete a user setting (falls back to dealership/default)"""
        result = await db.execute(
            select(UserSetting).where(
                UserSetting.user_id == user_id,
                UserSetting.setting_key == key
            )
        )
        setting = result.scalar_one_or_none()
        
        if setting:
            await db.delete(setting)
            await db.commit()
            return True
        return False

    @staticmethod
    async def _validate_setting_value(definition: SettingDefinition, value: Any) -> None:
        """Validate a setting value against its definition"""
        
        # Basic validation - ensure value is not None
        if value is None:
            raise ValueError(f"Setting {definition.setting_key} cannot be None")
        
        # For reply timing settings, add specific validation
        if definition.setting_key == "reply_timing_mode":
            valid_modes = ["instant", "custom_delay", "business_hours"]
            if value not in valid_modes:
                raise ValueError(f"reply_timing_mode must be one of: {valid_modes}")
        
        elif definition.setting_key in ["reply_delay_seconds", "business_hours_delay_seconds"]:
            if not isinstance(value, (int, float)) or value < 0 or value > 300:
                raise ValueError(f"{definition.setting_key} must be a number between 0 and 300")
        
        elif definition.setting_key in ["business_hours_start", "business_hours_end"]:
            if not isinstance(value, str):
                raise ValueError(f"{definition.setting_key} must be a string in HH:MM format")
            # Basic format validation
            try:
                from datetime import time
                time.fromisoformat(value)
            except ValueError:
                raise ValueError(f"{definition.setting_key} must be in HH:MM format")