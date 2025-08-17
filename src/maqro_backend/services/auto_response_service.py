"""
Auto-Response Service for intelligent message filtering
"""
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)

# Auto-response rules based on frequency settings
AUTO_RESPONSE_RULES = {
    "low": {
        "require_vehicle_match": True,     # Must find matching vehicles
        "require_clear_keywords": True     # Must have specific action keywords
    },
    "medium": {
        "require_vehicle_match": True,     # Must find matching vehicles  
        "require_clear_keywords": False    # Any vehicle-related inquiry
    },
    "high": {
        "require_vehicle_match": False,    # Respond even without vehicle matches
        "require_clear_keywords": False    # Any message gets a response
    },
    "send_all": {
        "require_vehicle_match": False,    # Respond to everything
        "require_clear_keywords": False    # No filtering at all
    }
}

# Keywords that indicate clear actionable intent
ACTION_KEYWORDS = [
    "price", "cost", "how much", "financing", "finance", 
    "test drive", "drive", "schedule", "appointment",
    "available", "in stock", "have", "inventory",
    "lease", "payment", "monthly", "buy", "purchase",
    "trade", "trade-in", "sell", "contact", "call",
    "visit", "come in", "hours", "location", "address"
]


class AutoResponseService:
    """Service for determining when to automatically respond to messages"""
    
    @staticmethod
    async def should_auto_respond(
        db: AsyncSession,
        user_id: str, 
        message: str, 
        retrieved_vehicles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Determine if we should automatically respond to a message
        
        Args:
            db: Database session
            user_id: ID of the user/salesperson
            message: Customer's message text
            retrieved_vehicles: List of vehicles found by RAG search
        
        Returns:
            Dict containing decision and reasoning
        """
        try:
            # Get user's auto-response settings
            from .settings_service import SettingsService
            
            # Check if auto-response is enabled
            auto_respond_enabled = await SettingsService.get_user_setting(
                db, user_id, 'auto_respond_enabled'
            )
            
            if not auto_respond_enabled:
                return {
                    "should_respond": False,
                    "reason": "Auto-response disabled",
                    "frequency": None
                }
            
            # Get frequency setting
            frequency = await SettingsService.get_user_setting(
                db, user_id, 'auto_respond_frequency'
            ) or "medium"
            
            # Evaluate message against rules
            decision = AutoResponseService._evaluate_message(
                frequency=frequency,
                message=message,
                retrieved_vehicles=retrieved_vehicles
            )
            
            return {
                "should_respond": decision["should_respond"],
                "reason": decision["reason"],
                "frequency": frequency,
                "has_vehicles": len(retrieved_vehicles) > 0,
                "has_keywords": decision["has_keywords"]
            }
            
        except Exception as e:
            logger.error(f"Error in auto-response evaluation: {str(e)}")
            return {
                "should_respond": False,
                "reason": f"Error: {str(e)}",
                "frequency": None
            }
    
    @staticmethod
    def _evaluate_message(
        frequency: str, 
        message: str, 
        retrieved_vehicles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluate a message against auto-response rules
        
        Args:
            frequency: Auto-response frequency setting
            message: Customer's message text
            retrieved_vehicles: List of vehicles found by RAG
        
        Returns:
            Dict with decision and reasoning
        """
        # Get rules for this frequency
        rules = AUTO_RESPONSE_RULES.get(frequency, AUTO_RESPONSE_RULES["medium"])
        
        # Check if we found vehicles
        has_vehicles = len(retrieved_vehicles) > 0
        
        # Check for clear action keywords
        message_lower = message.lower()
        has_keywords = any(keyword in message_lower for keyword in ACTION_KEYWORDS)
        
        # Apply rules based on frequency setting
        if rules["require_vehicle_match"] and not has_vehicles:
            return {
                "should_respond": False,
                "reason": f"Frequency '{frequency}' requires vehicle matches, but none found",
                "has_keywords": has_keywords
            }
            
        if rules["require_clear_keywords"] and not has_keywords:
            return {
                "should_respond": False,
                "reason": f"Frequency '{frequency}' requires action keywords, but none found",
                "has_keywords": has_keywords
            }
        
        # All conditions met
        return {
            "should_respond": True,
            "reason": f"Message meets '{frequency}' frequency criteria",
            "has_keywords": has_keywords
        }
    
    @staticmethod
    def get_frequency_description(frequency: str) -> str:
        """Get user-friendly description of frequency setting"""
        descriptions = {
            "low": "Responds only when we find matching vehicles AND customer asks about pricing, test drives, or availability",
            "medium": "Responds when we find matching vehicles for any vehicle inquiry",
            "high": "Responds to any customer message, even if no vehicles match", 
            "send_all": "Responds to every customer message immediately"
        }
        return descriptions.get(frequency, descriptions["medium"])
    
    @staticmethod
    def get_action_keywords() -> List[str]:
        """Get list of action keywords for debugging/testing"""
        return ACTION_KEYWORDS.copy()