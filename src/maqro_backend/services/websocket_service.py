"""
WebSocket Service for real-time communication with mobile apps
"""
import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, device_info: Optional[Dict[str, Any]] = None):
        """Connect a new WebSocket client"""
        await websocket.accept()
        
        # Store connection
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        
        # Store metadata
        self.connection_metadata[websocket] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow().isoformat(),
            "device_info": device_info or {},
            "last_activity": datetime.utcnow().isoformat()
        }
        
        logger.info(f"WebSocket connected for user {user_id}. Total connections: {len(self.active_connections[user_id])}")
        
        # Send welcome message
        await self.send_personal_message(
            websocket,
            {
                "type": "connection_established",
                "message": "Connected to Maqro Dealership",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id
            }
        )
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket client"""
        # Find and remove from active connections
        user_id = None
        for uid, connections in self.active_connections.items():
            if websocket in connections:
                connections.remove(websocket)
                user_id = uid
                break
        
        # Remove metadata
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]
        
        # Clean up empty user connections
        if user_id and not self.active_connections[user_id]:
            del self.active_connections[user_id]
        
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            # Mark connection for cleanup
            self.disconnect(websocket)
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all connections of a specific user"""
        if user_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                    # Update last activity
                    if websocket in self.connection_metadata:
                        self.connection_metadata[websocket]["last_activity"] = datetime.utcnow().isoformat()
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.add(websocket)
            
            # Clean up disconnected connections
            for websocket in disconnected:
                self.disconnect(websocket)
    
    async def broadcast_to_dealership(self, dealership_id: str, message: Dict[str, Any], exclude_user: Optional[str] = None):
        """Broadcast message to all users in a dealership"""
        # This would require dealership user mapping
        # For now, we'll implement a simpler version
        logger.info(f"Broadcasting to dealership {dealership_id}: {message}")
        
        # In a real implementation, you'd query the database for all users in the dealership
        # and send to each one
        pass
    
    def get_connection_count(self, user_id: Optional[str] = None) -> int:
        """Get total connection count or count for specific user"""
        if user_id:
            return len(self.active_connections.get(user_id, set()))
        else:
            return sum(len(connections) for connections in self.active_connections.values())
    
    def get_active_users(self) -> Set[str]:
        """Get set of currently connected user IDs"""
        return set(self.active_connections.keys())
    
    async def send_conversation_update(self, user_id: str, conversation_data: Dict[str, Any]):
        """Send real-time conversation update to a user"""
        message = {
            "type": "conversation_update",
            "data": conversation_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_user(user_id, message)
    
    async def send_lead_update(self, user_id: str, lead_data: Dict[str, Any]):
        """Send real-time lead update to a user"""
        message = {
            "type": "lead_update",
            "data": lead_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_user(user_id, message)
    
    async def send_notification(self, user_id: str, notification_data: Dict[str, Any]):
        """Send real-time notification to a user"""
        message = {
            "type": "notification",
            "data": notification_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_user(user_id, message)


# Global connection manager instance
connection_manager = ConnectionManager()


class WebSocketService:
    """Service for handling WebSocket operations"""
    
    @staticmethod
    async def handle_websocket_connection(
        websocket: WebSocket, 
        user_id: str, 
        device_info: Optional[Dict[str, Any]] = None
    ):
        """Handle WebSocket connection lifecycle"""
        await connection_manager.connect(websocket, user_id, device_info)
        
        try:
            # Keep connection alive and handle incoming messages
            while True:
                # Wait for messages from client
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    await WebSocketService._handle_client_message(websocket, message, user_id)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received from user {user_id}")
                    await connection_manager.send_personal_message(
                        websocket,
                        {"type": "error", "message": "Invalid JSON format"}
                    )
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user {user_id}")
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {e}")
        finally:
            connection_manager.disconnect(websocket)
    
    @staticmethod
    async def _handle_client_message(websocket: WebSocket, message: Dict[str, Any], user_id: str):
        """Handle incoming WebSocket messages from client"""
        message_type = message.get("type")
        
        if message_type == "ping":
            # Respond to ping with pong
            await connection_manager.send_personal_message(
                websocket,
                {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
            )
        
        elif message_type == "device_info":
            # Update device information
            device_info = message.get("data", {})
            if websocket in connection_manager.connection_metadata:
                connection_manager.connection_metadata[websocket]["device_info"].update(device_info)
            
            await connection_manager.send_personal_message(
                websocket,
                {"type": "device_info_updated", "timestamp": datetime.utcnow().isoformat()}
            )
        
        elif message_type == "fcm_token":
            # Store FCM token for push notifications
            fcm_token = message.get("data", {}).get("fcm_token")
            if fcm_token:
                # In a real implementation, you'd store this in the database
                logger.info(f"FCM token received for user {user_id}: {fcm_token[:20]}...")
                
                await connection_manager.send_personal_message(
                    websocket,
                    {"type": "fcm_token_received", "timestamp": datetime.utcnow().isoformat()}
                )
        
        else:
            # Unknown message type
            logger.warning(f"Unknown message type from user {user_id}: {message_type}")
            await connection_manager.send_personal_message(
                websocket,
                {"type": "error", "message": f"Unknown message type: {message_type}"}
            )
    
    @staticmethod
    async def send_conversation_update_to_user(user_id: str, conversation_data: Dict[str, Any]):
        """Send conversation update to a specific user via WebSocket"""
        await connection_manager.send_conversation_update(user_id, conversation_data)
    
    @staticmethod
    async def send_lead_update_to_user(user_id: str, lead_data: Dict[str, Any]):
        """Send lead update to a specific user via WebSocket"""
        await connection_manager.send_lead_update(user_id, lead_data)
    
    @staticmethod
    async def send_notification_to_user(user_id: str, notification_data: Dict[str, Any]):
        """Send notification to a specific user via WebSocket"""
        await connection_manager.send_notification(user_id, notification_data)
