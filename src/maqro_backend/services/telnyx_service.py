"""
Telnyx Messaging Service for sending and handling SMS messages
"""
import httpx
import hmac
import hashlib
from typing import Dict, Any, Optional
from ..core.config import settings
from ..utils.phone_utils import normalize_phone_number
import logging
import json

logger = logging.getLogger(__name__)


class TelnyxMessagingService:
    """Service for handling Telnyx messaging operations (SMS only)"""
    
    def __init__(self):
        self.api_key = settings.telnyx_api_key
        self.messaging_profile_id = settings.telnyx_messaging_profile_id
        self.phone_number = settings.telnyx_phone_number
        self.webhook_secret = settings.telnyx_webhook_secret
        self.base_url = "https://api.telnyx.com/v2"
    
    def _validate_credentials(self) -> bool:
        """Validate that all required Telnyx credentials are available"""
        return all([self.api_key, self.messaging_profile_id, self.phone_number])
    
    async def send_sms(self, to: str, message: str) -> Dict[str, Any]:
        """
        Send SMS via Telnyx API
        
        Args:
            to: Recipient phone number
            message: SMS message text
            
        Returns:
            Dict with success status and message ID or error
        """
        if not self._validate_credentials():
            logger.error("Telnyx credentials not configured")
            return {"success": False, "error": "Telnyx credentials not configured"}
        
        # Prepare request payload for Telnyx API
        payload = {
            "from": self.phone_number,
            "to": to,
            "text": message,
            "messaging_profile_id": self.messaging_profile_id,
            "type": "SMS"
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code not in [200, 201]:
                    logger.error(f"Telnyx API error: {response.status_code} - {response.text}")
                    return {
                        "success": False, 
                        "error": f"API error: {response.status_code}",
                        "details": response.text
                    }
                
                result = response.json()
                logger.info(f"Telnyx SMS response: {result}")
                
                # Check if message was sent successfully
                if result.get("data"):
                    message_data = result["data"]
                    return {
                        "success": True,
                        "message_id": message_data.get("id"),
                        "to": to,
                        "from": self.phone_number,
                        "status": "sent"
                    }
                else:
                    logger.error(f"Invalid response from Telnyx API: {result}")
                    return {"success": False, "error": "Invalid response from Telnyx"}
                    
        except httpx.TimeoutException:
            logger.error("Telnyx API request timeout")
            return {"success": False, "error": "Request timeout"}
        except httpx.RequestError as e:
            logger.error(f"HTTP request error: {e}")
            return {"success": False, "error": "Network error"}
        except Exception as e:
            logger.error(f"Unexpected error sending SMS: {e}")
            return {"success": False, "error": "Internal error"}
    
    
    
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """
        Verify Telnyx webhook signature for security
        
        Args:
            payload: Raw request body as string
            signature: X-Telnyx-Signature header value
            
        Returns:
            True if signature is valid, False otherwise
        """
        if not self.webhook_secret:
            logger.warning("Webhook secret not configured - skipping signature verification")
            return True
            
        try:
            # Calculate expected signature using HMAC-SHA256
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures securely
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False
    
    def normalize_phone_number(self, phone: str) -> str:
        """
        Normalize phone number using centralized utility.
        
        Args:
            phone: Raw phone number from webhook
            
        Returns:
            Normalized phone number or empty string if invalid
        """
        normalized = normalize_phone_number(phone)
        return normalized if normalized else ""
    
    def parse_webhook_message(self, webhook_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse incoming Telnyx webhook message
        
        Args:
            webhook_data: Raw webhook JSON payload
            
        Returns:
            Parsed message data or None if invalid
        """
        try:
            # Navigate the Telnyx webhook structure
            data = webhook_data.get("data", {})
            event_type = webhook_data.get("event_type")
            
            if not data or event_type != "message.received":
                return None
            
            # Extract message details
            parsed_data = {
                "message_id": data.get("id"),
                "from_phone": data.get("from"),
                "to_phone": data.get("to"),
                "timestamp": data.get("received_at"),
                "message_type": data.get("type"),
                "direction": data.get("direction"),
                "messaging_profile_id": data.get("messaging_profile_id")
            }
            
            # Extract message content based on type
            if data.get("type") == "SMS":
                parsed_data["message_text"] = data.get("text")
            elif data.get("type") == "MMS":
                # Handle MMS messages
                parsed_data["media_urls"] = data.get("media", [])
                parsed_data["message_text"] = data.get("text")
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing Telnyx webhook message: {e}")
            return None
    
    async def get_message_status(self, message_id: str) -> Dict[str, Any]:
        """
        Get the status of a sent message
        
        Args:
            message_id: The ID of the message to check
            
        Returns:
            Dict with message status information
        """
        if not self.api_key:
            return {"success": False, "error": "API key not configured"}
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/messages/{message_id}",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "data": result.get("data", {})
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "details": response.text
                    }
                    
        except Exception as e:
            logger.error(f"Error getting message status: {e}")
            return {"success": False, "error": "Internal error"}


# Global instance
telnyx_service = TelnyxMessagingService()
