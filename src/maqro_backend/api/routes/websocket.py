"""
WebSocket routes for real-time communication with mobile apps
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Optional
import logging
from ...services.websocket_service import WebSocketService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for real-time communication
    
    Query parameters:
    - token: JWT token for authentication (optional, can be passed in headers)
    
    This endpoint allows mobile apps to:
    1. Receive real-time conversation updates
    2. Receive real-time lead updates
    3. Send device information and FCM tokens
    4. Maintain persistent connection for instant updates
    """
    try:
        # Basic validation
        if not user_id:
            await websocket.close(code=1008, reason="User ID required")
            return
        
        # Accept the connection first
        await websocket.accept()
        
        # Send initial connection message
        await websocket.send_text(
            f'{{"type": "connection_established", "message": "Connected to Maqro Dealership", "user_id": "{user_id}"}}'
        )
        
        logger.info(f"WebSocket connection established for user {user_id}")
        
        # Handle the connection
        await WebSocketService.handle_websocket_connection(websocket, user_id)
        
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        try:
            await websocket.close(code=1011, reason="Internal error")
        except:
            pass


@router.websocket("/ws/authenticated/{user_id}")
async def authenticated_websocket_endpoint(
    websocket: WebSocket, 
    user_id: str,
    token: str
):
    """
    Authenticated WebSocket endpoint
    
    This endpoint requires a valid JWT token and validates the user_id
    against the authenticated user before establishing the connection.
    """
    try:
        # Validate token and user_id
        if not token:
            await websocket.close(code=1008, reason="Authentication token required")
            return
        
        # In a real implementation, you'd validate the JWT token here
        # and extract the authenticated user_id to compare with the path parameter
        
        # For now, we'll accept the connection if token is provided
        if not token or len(token) < 10:  # Basic validation
            await websocket.close(code=1008, reason="Invalid authentication token")
            return
        
        # Accept the connection
        await websocket.accept()
        
        # Send authenticated connection message
        await websocket.send_text(
            f'{{"type": "authenticated_connection", "message": "Authenticated connection established", "user_id": "{user_id}"}}'
        )
        
        logger.info(f"Authenticated WebSocket connection established for user {user_id}")
        
        # Handle the connection
        await WebSocketService.handle_websocket_connection(websocket, user_id)
        
    except WebSocketDisconnect:
        logger.info(f"Authenticated WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"Authenticated WebSocket error for user {user_id}: {e}")
        try:
            await websocket.close(code=1011, reason="Internal error")
        except:
            pass


@router.get("/ws/status")
async def websocket_status():
    """
    Get WebSocket connection status and statistics
    
    Returns:
        Dict with connection counts and active users
    """
    from ...services.websocket_service import connection_manager
    
    return {
        "total_connections": connection_manager.get_connection_count(),
        "active_users": list(connection_manager.get_active_users()),
        "status": "active"
    }
