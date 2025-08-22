"""
Mobile App Notification Service for sending push notifications and real-time updates
"""
import firebase_admin
from firebase_admin import credentials, messaging
from typing import Dict, Any, Optional, List
import logging
import json
from datetime import datetime
import asyncio
from ..core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling mobile app notifications and real-time updates"""
    
    def __init__(self):
        self.initialized = False
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                # Try to initialize with service account key from environment
                if hasattr(settings, 'firebase_service_account_key') and settings.firebase_service_account_key:
                    cred = credentials.Certificate(settings.firebase_service_account_key)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase initialized with service account key")
                else:
                    # Initialize with default credentials (for development)
                    firebase_admin.initialize_app()
                    logger.info("Firebase initialized with default credentials")
                
                self.initialized = True
            else:
                self.initialized = True
                logger.info("Firebase already initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self.initialized = False
    
    async def send_notification_to_user(
        self, 
        user_id: str, 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None,
        fcm_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send push notification to a specific user's mobile app
        
        Args:
            user_id: UUID of the user to notify
            title: Notification title
            body: Notification body text
            data: Additional data to send with notification
            fcm_token: FCM token for the user's device (optional, will be fetched if not provided)
            
        Returns:
            Dict with success status and message ID or error
        """
        if not self.initialized:
            logger.error("Firebase not initialized")
            return {"success": False, "error": "Firebase not initialized"}
        
        try:
            # If no FCM token provided, fetch it from user profile
            if not fcm_token:
                fcm_token = await self._get_user_fcm_token(user_id)
                if not fcm_token:
                    return {"success": False, "error": "No FCM token found for user"}
            
            # Prepare notification message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                token=fcm_token
            )
            
            # Send the message
            response = messaging.send(message)
            
            logger.info(f"Notification sent successfully to user {user_id}: {response}")
            
            return {
                "success": True,
                "message_id": response,
                "user_id": user_id,
                "status": "sent"
            }
            
        except Exception as e:
            logger.error(f"Error sending notification to user {user_id}: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_conversation_notification(
        self, 
        user_id: str, 
        lead_name: str, 
        message_preview: str,
        lead_id: str,
        conversation_id: str
    ) -> Dict[str, Any]:
        """
        Send notification for new conversation message
        
        Args:
            user_id: UUID of the salesperson to notify
            lead_name: Name of the lead
            message_preview: Preview of the message
            lead_id: UUID of the lead
            conversation_id: UUID of the conversation
            
        Returns:
            Dict with success status and message ID or error
        """
        title = f"New message from {lead_name}"
        body = message_preview[:100] + "..." if len(message_preview) > 100 else message_preview
        
        data = {
            "type": "new_message",
            "lead_id": lead_id,
            "conversation_id": conversation_id,
            "lead_name": lead_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.send_notification_to_user(user_id, title, body, data)
    
    async def send_lead_notification(
        self, 
        user_id: str, 
        lead_name: str, 
        lead_source: str,
        lead_id: str
    ) -> Dict[str, Any]:
        """
        Send notification for new lead
        
        Args:
            user_id: UUID of the salesperson to notify
            lead_name: Name of the lead
            lead_source: Source of the lead
            lead_id: UUID of the lead
            
        Returns:
            Dict with success status and message ID or error
        """
        title = "New Lead Assigned"
        body = f"{lead_name} from {lead_source}"
        
        data = {
            "type": "new_lead",
            "lead_id": lead_id,
            "lead_name": lead_name,
            "lead_source": lead_source,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.send_notification_to_user(user_id, title, body, data)
    
    async def _get_user_fcm_token(self, user_id: str) -> Optional[str]:
        """
        Get FCM token for a user from their profile
        
        Args:
            user_id: UUID of the user
            
        Returns:
            FCM token string or None if not found
        """
        try:
            # This would typically query the database for the user's FCM token
            # For now, we'll return None and require the token to be passed in
            # In a real implementation, you'd store FCM tokens in the user profile
            logger.warning(f"FCM token lookup not implemented for user {user_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting FCM token for user {user_id}: {e}")
            return None
    
    async def send_bulk_notification(
        self, 
        user_ids: List[str], 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send notification to multiple users
        
        Args:
            user_ids: List of user UUIDs to notify
            title: Notification title
            body: Notification body text
            data: Additional data to send with notification
            
        Returns:
            Dict with success status and results
        """
        if not self.initialized:
            return {"success": False, "error": "Firebase not initialized"}
        
        results = []
        for user_id in user_ids:
            result = await self.send_notification_to_user(user_id, title, body, data)
            results.append({"user_id": user_id, "result": result})
        
        success_count = sum(1 for r in results if r["result"]["success"])
        
        return {
            "success": True,
            "total_users": len(user_ids),
            "successful": success_count,
            "failed": len(user_ids) - success_count,
            "results": results
        }


# Global instance
notification_service = NotificationService()
