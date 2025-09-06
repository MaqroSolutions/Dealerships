"""
Telnyx SMS Service for sending and handling SMS messages
"""
import httpx
import hmac
import hashlib
import json
from typing import Dict, Any, Optional
from ..core.config import settings
from ..utils.phone_utils import normalize_phone_number
import logging

logger = logging.getLogger(__name__)


class TelnyxSMSService:
    """Service for handling Telnyx SMS operations"""
    
    def __init__(self):
        self.api_key = settings.telnyx_api_key
        self.phone_number = settings.telnyx_phone_number
        self.messaging_profile_id = settings.telnyx_messaging_profile_id
        self.webhook_secret = settings.telnyx_webhook_secret
        self.base_url = "https://api.telnyx.com/v2"
    
    def _validate_credentials(self) -> bool:
        """Validate that all required Telnyx credentials are available"""
        return all([
            self.api_key,
            self.phone_number,
            self.messaging_profile_id
        ])
    
    async def send_sms(self, to: str, message: str) -> Dict[str, Any]:
        """
        Send SMS message via Telnyx API
        
        Args:
            to: Recipient phone number (E.164 format)
            message: Message text to send
            
        Returns:
            Dict with success status and response data
        """
        if not self._validate_credentials():
            logger.error("Telnyx credentials not properly configured")
            return {
                "success": False,
                "error": "Telnyx credentials not configured"
            }
        
        try:
            # Normalize phone number to E.164 format
            normalized_to = normalize_phone_number(to)
            if not normalized_to:
                return {
                    "success": False,
                    "error": "Invalid phone number format"
                }
            
            # Prepare request payload
            payload = {
                "from": self.phone_number,
                "to": normalized_to,
                "text": message,
                "messaging_profile_id": self.messaging_profile_id
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                response_data = response.json()
                
                if response.status_code == 200:
                    logger.info(f"SMS sent successfully to {normalized_to}")
                    return {
                        "success": True,
                        "message_id": response_data.get("data", {}).get("id"),
                        "response": response_data
                    }
                else:
                    logger.error(f"Failed to send SMS: {response.status_code} - {response_data}")
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "response": response_data
                    }
                    
        except httpx.TimeoutException:
            logger.error("Timeout while sending SMS via Telnyx")
            return {
                "success": False,
                "error": "Request timeout"
            }
        except Exception as e:
            logger.error(f"Error sending SMS via Telnyx: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """
        Verify webhook signature from Telnyx
        
        Args:
            payload: Raw request body as string
            signature: X-Telnyx-Signature header value
            
        Returns:
            True if signature is valid, False otherwise
        """
        if not self.webhook_secret:
            logger.warning("No webhook secret configured, skipping signature verification")
            return True  # Allow if no secret is configured
        
        try:
            # Telnyx uses HMAC-SHA256 with the webhook secret
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures (constant time comparison)
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False
    
    def parse_webhook_message(self, webhook_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse incoming webhook message from Telnyx
        
        Args:
            webhook_data: Raw webhook payload from Telnyx
            
        Returns:
            Parsed message data or None if not a valid message
        """
        try:
            # Check if this is a message event
            event_type = webhook_data.get("data", {}).get("event_type")
            
            if event_type != "message.received":
                logger.info(f"Ignoring non-message event: {event_type}")
                return None
            
            # Extract message data
            message_data = webhook_data.get("data", {}).get("payload", {})
            
            # Get message details
            from_phone = message_data.get("from", {}).get("phone_number")
            to_phone = message_data.get("to", {}).get("phone_number")
            message_text = message_data.get("text")
            message_id = message_data.get("id")
            
            if not from_phone or not message_text:
                logger.warning("Missing required message data in webhook")
                return None
            
            return {
                "message_id": message_id,
                "from_phone": from_phone,
                "to_phone": to_phone,
                "message_text": message_text,
                "message_type": "text",
                "timestamp": message_data.get("received_at")
            }
            
        except Exception as e:
            logger.error(f"Error parsing webhook message: {e}")
            return None
    
    def normalize_phone_number(self, phone: str) -> str:
        """Normalize phone number to E.164 format"""
        return normalize_phone_number(phone)


# Create service instance
telnyx_service = TelnyxSMSService()
