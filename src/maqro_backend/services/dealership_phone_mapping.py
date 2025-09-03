"""
Dealership Phone Number Mapping Service

This service handles mapping phone numbers to dealerships for proper data isolation
in multi-dealership environments.
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db.models import Dealership, Lead
from ..utils.phone_utils import normalize_phone_number

logger = logging.getLogger(__name__)


class DealershipPhoneMappingService:
    """Service for mapping phone numbers to dealerships"""
    
    def __init__(self):
        """Initialize the mapping service"""
        pass
    
    async def get_dealership_for_phone(
        self, 
        session: AsyncSession, 
        phone_number: str
    ) -> None | str:
        """
        Determine which dealership a phone number belongs to.
        
        Priority order:
        1. Check if phone number is in existing leads (most reliable)
        2. Check dealership integration_config for phone mappings
        3. Use default dealership (fallback)
        
        Args:
            session: Database session
            phone_number: Normalized phone number
            
        Returns:
            Dealership ID (UUID string) or None if not found
        """
        try:
            normalized_phone = normalize_phone_number(phone_number)
            if not normalized_phone:
                logger.warning(f"Invalid phone number format: {phone_number}")
                return None
            
            # Method 1: Check existing leads (most reliable)
            dealership_id = await self._find_dealership_from_leads(session, normalized_phone)
            if dealership_id:
                logger.info(f"Found dealership {dealership_id} from existing lead for phone {normalized_phone}")
                return dealership_id
            
            # Method 2: Check dealership integration_config for phone mappings
            dealership_id = await self._find_dealership_from_config(session, normalized_phone)
            if dealership_id:
                logger.info(f"Found dealership {dealership_id} from integration config for phone {normalized_phone}")
                return dealership_id
            
            # Method 3: Use default dealership (fallback)
            default_dealership_id = "d660c7d6-99e2-4fa8-b99b-d221def53d20"
            logger.warning(f"No dealership mapping found for phone {normalized_phone}, using default: {default_dealership_id}")
            return default_dealership_id
            
        except Exception as e:
            logger.error(f"Error determining dealership for phone {phone_number}: {e}")
            return None
    
    async def _find_dealership_from_leads(
        self, 
        session: AsyncSession, 
        normalized_phone: str
    ) -> None | str:
        """Find dealership by looking up existing leads with this phone number."""
        try:
            result = await session.execute(
                select(Lead.dealership_id)
                .where(Lead.phone == normalized_phone)
                .limit(1)
            )
            
            dealership_id = result.scalar_one_or_none()
            return str(dealership_id) if dealership_id else None
            
        except Exception as e:
            logger.error(f"Error finding dealership from leads: {e}")
            return None
    
    async def _find_dealership_from_config(
        self, 
        session: AsyncSession, 
        normalized_phone: str
    ) -> None | str:
        """Find dealership by checking integration_config for phone mappings."""
        try:
            # Get all dealerships with integration config
            result = await session.execute(
                select(Dealership.id, Dealership.integration_config)
            )
            
            dealerships = result.fetchall()
            
            for dealership in dealerships:
                config = dealership.integration_config or {}
                
                # Check for WhatsApp phone mappings
                whatsapp_config = config.get("whatsapp", {})
                whatsapp_phones = whatsapp_config.get("phone_numbers", [])
                
                # Check for Vonage phone mappings
                vonage_config = config.get("vonage", {})
                vonage_phones = vonage_config.get("phone_numbers", [])
                
                # Check if this phone matches any configured numbers
                all_configured_phones = whatsapp_phones + vonage_phones
                
                for configured_phone in all_configured_phones:
                    if self._phones_match(normalized_phone, configured_phone):
                        return str(dealership.id)
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding dealership from config: {e}")
            return None
    
    def _phones_match(self, phone1: str, phone2: str) -> bool:
        """Check if two phone numbers match (with normalization)."""
        try:
            normalized1 = normalize_phone_number(phone1)
            normalized2 = normalize_phone_number(phone2)
            
            return normalized1 == normalized2 if normalized1 and normalized2 else False
            
        except Exception:
            return False
    
    async def set_dealership_phone_mapping(
        self,
        session: AsyncSession,
        dealership_id: str,
        phone_numbers: list[str],
        integration_type: str = "whatsapp"
    ) -> bool:
        """
        Set phone number mappings for a dealership.
        
        Args:
            session: Database session
            dealership_id: Dealership UUID
            phone_numbers: List of phone numbers to map
            integration_type: "whatsapp" or "vonage"
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get current dealership
            result = await session.execute(
                select(Dealership)
                .where(Dealership.id == dealership_id)
            )
            
            dealership = result.scalar_one_or_none()
            if not dealership:
                logger.error(f"Dealership {dealership_id} not found")
                return False
            
            # Get current config
            config = dealership.integration_config or {}
            
            # Update the specific integration config
            if integration_type not in config:
                config[integration_type] = {}
            
            config[integration_type]["phone_numbers"] = phone_numbers
            
            # Update dealership
            dealership.integration_config = config
            await session.commit()
            
            logger.info(f"Updated {integration_type} phone mappings for dealership {dealership_id}: {phone_numbers}")
            return True
            
        except Exception as e:
            logger.error(f"Error setting dealership phone mapping: {e}")
            await session.rollback()
            return False


# Global instance
dealership_phone_mapping_service = DealershipPhoneMappingService()
