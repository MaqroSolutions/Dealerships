"""
Reply Scheduler for Maqro RAG system.

This module provides configurable reply timing to make AI responses feel more natural
and give dealership admins control over response behavior.
"""
import asyncio
import random
import logging
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, time
from enum import Enum

logger = logging.getLogger(__name__)


class ReplyTimingMode(Enum):
    """Reply timing modes for dealerships"""
    INSTANT = "instant"
    CUSTOM_DELAY = "custom_delay"
    BUSINESS_HOURS = "business_hours"


class MessageType(Enum):
    """Types of customer messages for classification"""
    TRANSACTIONAL = "transactional"
    RAPPORT_BUILDING = "rapport_building"


class ReplyScheduler:
    """
    Scheduler that determines when to send AI responses based on dealership settings.
    
    Features:
    - Instant replies for transactional queries
    - Configurable delays for rapport-building messages
    - Business hours profiles
    - Random jitter to avoid robotic timing
    - After-hours instant replies
    """
    
    # Constants
    MAX_DELAY_SECONDS = 300  # 5 minutes
    JITTER_RANGE = 15  # ±15 seconds
    DEFAULT_DELAY = 30
    DEFAULT_BUSINESS_HOURS_DELAY = 60
    
    def __init__(self):
        """Initialize reply scheduler with message classification patterns"""
        self._transactional_patterns = self._initialize_transactional_patterns()
        self._rapport_patterns = self._initialize_rapport_patterns()
    
    def _initialize_transactional_patterns(self) -> List[str]:
        """Initialize patterns for transactional queries (always instant)"""
        return [
            # Hours queries
            "hours", "open", "closed", "when are you", "what time",
            # Inventory queries
            "in stock", "available", "do you have", "inventory", "stock",
            # Pricing queries
            "price", "cost", "how much", "pricing",
            # Location queries
            "address", "location", "where are you", "directions",
            # Contact queries
            "phone", "number", "call", "contact"
        ]
    
    def _initialize_rapport_patterns(self) -> List[str]:
        """Initialize patterns for rapport-building messages (use delay)"""
        return [
            # Greetings
            "hey", "hi", "hello", "what's up", "how are you",
            # Thanks
            "thanks", "thank you", "appreciate", "grateful",
            # Casual conversation
            "how's it going", "what's new", "how are things"
        ]
    
    async def should_delay_reply(
        self,
        message: str,
        dealership_settings: Dict[str, Any],
        current_time: Optional[datetime] = None
    ) -> Tuple[bool, float, str]:
        """
        Determine if a reply should be delayed and by how much.
        
        Args:
            message: Customer message content
            dealership_settings: Dealership's reply timing settings
            current_time: Current time (for testing), defaults to now
            
        Returns:
            Tuple of (should_delay, delay_seconds, reason)
        """
        current_time = current_time or datetime.now()
        
        # Always instant for transactional queries
        if self._is_transactional_query(message):
            return False, 0.0, "Transactional query - instant reply"
        
        # Get settings with defaults
        settings = self._extract_settings(dealership_settings)
        
        # Handle different reply modes
        return await self._process_reply_mode(message, settings, current_time)
    
    def _extract_settings(self, dealership_settings: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and normalize settings with defaults"""
        return {
            "reply_timing_mode": dealership_settings.get("reply_timing_mode", ReplyTimingMode.INSTANT.value),
            "reply_delay_seconds": dealership_settings.get("reply_delay_seconds", self.DEFAULT_DELAY),
            "business_hours_start": dealership_settings.get("business_hours_start", "09:00"),
            "business_hours_end": dealership_settings.get("business_hours_end", "17:00"),
            "business_hours_delay_seconds": dealership_settings.get("business_hours_delay_seconds", self.DEFAULT_BUSINESS_HOURS_DELAY)
        }
    
    async def _process_reply_mode(
        self, 
        message: str, 
        settings: Dict[str, Any], 
        current_time: datetime
    ) -> Tuple[bool, float, str]:
        """Process reply based on timing mode"""
        mode = settings["reply_timing_mode"]
        
        if mode == ReplyTimingMode.INSTANT.value:
            return False, 0.0, "Instant reply mode"
        
        elif mode == ReplyTimingMode.CUSTOM_DELAY.value:
            return self._handle_custom_delay(settings)
        
        elif mode == ReplyTimingMode.BUSINESS_HOURS.value:
            return self._handle_business_hours(settings, current_time)
        
        else:
            logger.warning(f"Unknown reply timing mode: {mode}")
            return False, 0.0, "Unknown mode - instant reply"
    
    def _handle_custom_delay(self, settings: Dict[str, Any]) -> Tuple[bool, float, str]:
        """Handle custom delay mode"""
        delay = settings["reply_delay_seconds"]
        delay_with_jitter = self._add_jitter(delay)
        return True, delay_with_jitter, f"Custom delay mode - {delay}s + jitter"
    
    def _handle_business_hours(
        self, 
        settings: Dict[str, Any], 
        current_time: datetime
    ) -> Tuple[bool, float, str]:
        """Handle business hours mode"""
        if not self._is_business_hours(
            current_time, 
            settings["business_hours_start"], 
            settings["business_hours_end"]
        ):
            return False, 0.0, "After hours - instant reply"
        
        delay = settings["business_hours_delay_seconds"]
        delay_with_jitter = self._add_jitter(delay)
        return True, delay_with_jitter, f"Business hours delay - {delay}s + jitter"
    
    def _add_jitter(self, base_delay: float) -> float:
        """Add random jitter to delay"""
        jitter = random.uniform(-self.JITTER_RANGE, self.JITTER_RANGE)
        return max(0, base_delay + jitter)
    
    def _is_transactional_query(self, message: str) -> bool:
        """Check if message is transactional (should get instant reply)"""
        message_lower = message.lower()
        return any(pattern in message_lower for pattern in self._transactional_patterns)
    
    def _is_business_hours(
        self, 
        current_time: datetime, 
        start_time_str: str, 
        end_time_str: str
    ) -> bool:
        """Check if current time is within business hours"""
        try:
            start_time = self._parse_time(start_time_str)
            end_time = self._parse_time(end_time_str)
            current_time_only = current_time.time()
            
            return self._is_time_in_range(current_time_only, start_time, end_time)
                
        except Exception as e:
            logger.error(f"Error parsing business hours: {e}")
            return True  # Default to business hours if parsing fails
    
    def _parse_time(self, time_str: str) -> time:
        """Parse time string in HH:MM format"""
        hour, minute = map(int, time_str.split(":"))
        return time(hour, minute)
    
    def _is_time_in_range(self, current: time, start: time, end: time) -> bool:
        """Check if current time is within the range [start, end]"""
        # Handle overnight business hours (e.g., 22:00 to 06:00)
        if start > end:
            return current >= start or current <= end
        else:
            return start <= current <= end
    
    async def schedule_reply(
        self,
        message: str,
        dealership_settings: Dict[str, Any],
        send_callback: callable,
        current_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Schedule a reply with appropriate delay.
        
        Args:
            message: Customer message content
            dealership_settings: Dealership's reply timing settings
            send_callback: Function to call when it's time to send the reply
            current_time: Current time (for testing)
            
        Returns:
            Dict with scheduling results
        """
        try:
            should_delay, delay_seconds, reason = await self.should_delay_reply(
                message, dealership_settings, current_time
            )
            
            if not should_delay:
                return await self._send_immediate_reply(send_callback, reason)
            else:
                return await self._schedule_delayed_reply(send_callback, delay_seconds, reason)
                
        except Exception as e:
            logger.error(f"Error scheduling reply: {e}")
            return self._create_error_result(str(e))
    
    async def _send_immediate_reply(self, send_callback: callable, reason: str) -> Dict[str, Any]:
        """Send reply immediately"""
        logger.info(f"Sending instant reply: {reason}")
        await send_callback()
        return {
            "success": True,
            "delayed": False,
            "delay_seconds": 0,
            "reason": reason
        }
    
    async def _schedule_delayed_reply(
        self, 
        send_callback: callable, 
        delay_seconds: float, 
        reason: str
    ) -> Dict[str, Any]:
        """Schedule a delayed reply"""
        logger.info(f"Scheduling delayed reply: {delay_seconds:.1f}s delay - {reason}")
        
        # Create and start the delayed task
        task = asyncio.create_task(self._delayed_send(send_callback, delay_seconds))
        
        return {
            "success": True,
            "delayed": True,
            "delay_seconds": delay_seconds,
            "reason": reason,
            "task": task
        }
    
    async def _delayed_send(self, send_callback: callable, delay_seconds: float) -> None:
        """Execute delayed send with error handling"""
        try:
            await asyncio.sleep(delay_seconds)
            await send_callback()
        except Exception as e:
            logger.error(f"Error in delayed send: {e}")
    
    def _create_error_result(self, error_message: str) -> Dict[str, Any]:
        """Create standardized error result"""
        return {
            "success": False,
            "error": error_message,
            "delayed": False,
            "delay_seconds": 0
        }
    
    def get_default_settings(self) -> Dict[str, Any]:
        """Get default reply timing settings for new dealerships"""
        return {
            "reply_timing_mode": ReplyTimingMode.INSTANT.value,
            "reply_delay_seconds": self.DEFAULT_DELAY,
            "business_hours_start": "09:00",
            "business_hours_end": "17:00",
            "business_hours_delay_seconds": self.DEFAULT_BUSINESS_HOURS_DELAY
        }
    
    def validate_settings(self, settings: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate reply timing settings.
        
        Args:
            settings: Settings dictionary to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Validate required fields
            if not self._validate_required_fields(settings):
                return False, "Missing required field: reply_timing_mode"
            
            # Validate reply timing mode
            if not self._validate_reply_mode(settings):
                valid_modes = [mode.value for mode in ReplyTimingMode]
                return False, f"Invalid reply_timing_mode. Must be one of: {valid_modes}"
            
            # Validate delay values
            delay_validation = self._validate_delay_values(settings)
            if not delay_validation[0]:
                return delay_validation
            
            # Validate time formats
            time_validation = self._validate_time_formats(settings)
            if not time_validation[0]:
                return time_validation
            
            return True, ""
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def _validate_required_fields(self, settings: Dict[str, Any]) -> bool:
        """Validate that required fields are present"""
        return "reply_timing_mode" in settings
    
    def _validate_reply_mode(self, settings: Dict[str, Any]) -> bool:
        """Validate reply timing mode"""
        valid_modes = [mode.value for mode in ReplyTimingMode]
        return settings["reply_timing_mode"] in valid_modes
    
    def _validate_delay_values(self, settings: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate delay value settings"""
        delay_fields = ["reply_delay_seconds", "business_hours_delay_seconds"]
        
        for field in delay_fields:
            if field in settings:
                delay = settings[field]
                if not isinstance(delay, (int, float)) or delay < 0 or delay > self.MAX_DELAY_SECONDS:
                    return False, f"{field} must be between 0 and {self.MAX_DELAY_SECONDS}"
        
        return True, ""
    
    def _validate_time_formats(self, settings: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate time format settings"""
        time_fields = ["business_hours_start", "business_hours_end"]
        
        for field in time_fields:
            if field in settings:
                try:
                    time.fromisoformat(settings[field])
                except ValueError:
                    return False, f"{field} must be in HH:MM format"
        
        return True, ""


# Global instance
reply_scheduler = ReplyScheduler()
