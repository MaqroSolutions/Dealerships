"""
Mobile App API routes for authentication and push notifications
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import logging
from datetime import datetime
import pytz

from ...api.deps import get_db_session
from ...crud import get_user_profile_by_user_id, update_user_profile

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

async def get_mock_user_id() -> str:
    """Mock user ID for mobile app testing - replace with real auth later"""
    return "d245e4bb-91ae-4ec4-ad0f-18307b38daa6"

@router.post("/login")
@limiter.limit("10/minute")  # Limit login attempts
async def mobile_login(
    request: Request,
    credentials: Dict[str, str],
    db: AsyncSession = Depends(get_db_session)
):
    """
    Mobile app login endpoint
    
    This endpoint:
    1. Validates email/password credentials
    2. Returns JWT token for mobile app authentication
    3. Returns user profile information
    """
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # TODO: Implement actual authentication logic
        # For now, we'll use a simple check against the database
        # In production, you should use proper password hashing and JWT tokens
        
        # This is a placeholder - replace with your actual auth logic
        if email == "demo@dealership.com" and password == "password123":
            # Mock user data - replace with actual user lookup
            user_data = {
                "id": "d245e4bb-91ae-4ec4-ad0f-18307b38daa6",
                "email": email,
                "full_name": "Demo Salesperson",
                "phone": "+1234567890",
                "dealership_id": "d660c7d6-99e2-4fa8-b99b-d221def53d20"
            }
            
            # Mock JWT token - replace with actual JWT generation
            token = "mock_jwt_token_" + str(datetime.now().timestamp())
            
            return {
                "success": True,
                "token": token,
                "user": user_data
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mobile login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me")
async def get_current_user(
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current user profile for mobile app
    """
    try:
        user_id = await get_mock_user_id()
        user_profile = await get_user_profile_by_user_id(db, user_id)
        if not user_profile:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user_profile.id),
            "email": user_profile.email,
            "full_name": user_profile.full_name,
            "phone": user_profile.phone,
            "dealership_id": str(user_profile.dealership_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/push-token")
async def register_push_token(
    token_data: Dict[str, str],
    db: AsyncSession = Depends(get_db_session)
):
    user_id = await get_mock_user_id()
    """
    Register push notification token for mobile app
    """
    try:
        push_token = token_data.get("push_token")
        if not push_token:
            raise HTTPException(status_code=400, detail="Push token required")
        
        # For now, we'll just log the token since the UserProfile model doesn't have a push_token field
        # TODO: Add push_token field to UserProfile model or store in a separate table
        logger.info(f"Push token received for user {user_id}: {push_token[:20]}...")
        
        return {
            "success": True,
            "message": "Push token received (storing functionality coming soon)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Push token registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/conversations")
async def get_conversations(
    db: AsyncSession = Depends(get_db_session)
):
    user_id = await get_mock_user_id()
    """
    Get all conversations/leads for the current user
    """
    try:
        # TODO: Implement actual conversation fetching
        # This should return leads assigned to the current user with conversation counts
        
        # Mock data for now
        mock_conversations = [
            {
                "id": "lead-1",
                "name": "John Smith",
                "phone": "+1234567890",
                "email": "john@example.com",
                "car_interest": "Toyota Camry",
                "source": "Website",
                "status": "New",
                "created_at": "2024-01-15T10:00:00Z",
                "last_contact": "2024-01-15T10:00:00Z",
                "conversation_count": 3
            },
            {
                "id": "lead-2",
                "name": "Sarah Johnson",
                "phone": "+1987654321",
                "email": "sarah@example.com",
                "car_interest": "Honda Civic",
                "source": "Phone",
                "status": "Contacted",
                "created_at": "2024-01-14T14:30:00Z",
                "last_contact": "2024-01-15T09:15:00Z",
                "conversation_count": 5
            }
        ]
        
        return {
            "success": True,
            "leads": mock_conversations
        }
        
    except Exception as e:
        logger.error(f"Get conversations error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/conversations/{lead_id}/history")
async def get_conversation_history(
    lead_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    user_id = await get_mock_user_id()
    """
    Get conversation history for a specific lead
    """
    try:
        # TODO: Implement actual conversation history fetching
        # This should return all messages for the specified lead
        
        # Mock data for now
        mock_messages = [
            {
                "id": "msg-1",
                "message": "Hi, I'm interested in the Toyota Camry you have in stock",
                "sender": "customer",
                "created_at": "2024-01-15T10:00:00Z"
            },
            {
                "id": "msg-2",
                "message": "Great! I'd be happy to help you with the Toyota Camry. What specific features are you looking for?",
                "sender": "agent",
                "created_at": "2024-01-15T10:05:00Z"
            },
            {
                "id": "msg-3",
                "message": "I'm looking for something with good fuel economy and safety features",
                "sender": "customer",
                "created_at": "2024-01-15T10:10:00Z"
            }
        ]
        
        return {
            "success": True,
            "messages": mock_messages
        }
        
    except Exception as e:
        logger.error(f"Get conversation history error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/conversations/pending-approvals")
async def get_pending_approvals(
    db: AsyncSession = Depends(get_db_session)
):
    user_id = await get_mock_user_id()
    """
    Get pending approvals for the current user
    """
    try:
        # TODO: Implement actual pending approvals fetching
        # This should return all pending approvals for the current user
        
        # Mock data for now
        mock_approvals = [
            {
                "id": "approval-1",
                "lead_id": "lead-1",
                "lead_name": "John Smith",
                "customer_phone": "+1234567890",
                "customer_message": "What's the best price you can offer?",
                "generated_response": "Hi John! I'd be happy to discuss pricing options for the Toyota Camry. We have several financing options available. Would you like to schedule a test drive to see the vehicle in person?",
                "created_at": "2024-01-15T11:00:00Z",
                "status": "pending"
            }
        ]
        
        return {
            "success": True,
            "approvals": mock_approvals
        }
        
    except Exception as e:
        logger.error(f"Get pending approvals error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/conversations/approve/{approval_id}")
async def approve_response(
    approval_id: str,
    approval_data: Dict[str, str],
    db: AsyncSession = Depends(get_db_session)
):
    user_id = await get_mock_user_id()
    """
    Approve, reject, edit, or force send a response
    """
    try:
        action = approval_data.get("action")
        
        if action == "approve":
            # TODO: Implement approval logic
            return {
                "success": True,
                "message": "Response approved and sent to customer"
            }
        elif action == "reject":
            # TODO: Implement rejection logic
            return {
                "success": True,
                "message": "Response rejected"
            }
        elif action == "edit":
            edit_instructions = approval_data.get("edit_instructions")
            if not edit_instructions:
                raise HTTPException(status_code=400, detail="Edit instructions required")
            
            # TODO: Implement edit logic
            return {
                "success": True,
                "message": "Response updated with your instructions"
            }
        elif action == "force_send":
            custom_message = approval_data.get("custom_message")
            if not custom_message:
                raise HTTPException(status_code=400, detail="Custom message required")
            
            # TODO: Implement force send logic
            return {
                "success": True,
                "message": "Your custom message sent to customer"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approve response error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/leads")
async def get_leads(
    db: AsyncSession = Depends(get_db_session)
):
    user_id = await get_mock_user_id()
    """
    Get all leads for the current user
    """
    try:
        # TODO: Implement actual leads fetching
        # This should return leads assigned to the current user
        
        # Mock data for now
        mock_leads = [
            {
                "id": "lead-1",
                "name": "John Smith",
                "phone": "+1234567890",
                "email": "john@example.com",
                "car_interest": "Toyota Camry",
                "source": "Website",
                "status": "New",
                "created_at": "2024-01-15T10:00:00Z",
                "last_contact": "2024-01-15T10:00:00Z",
                "conversation_count": 3
            }
        ]
        
        return {
            "success": True,
            "leads": mock_leads
        }
        
    except Exception as e:
        logger.error(f"Get leads error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/leads/{lead_id}")
async def get_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    user_id = await get_mock_user_id()
    """
    Get a specific lead by ID
    """
    try:
        # TODO: Implement actual lead fetching
        # This should return the specific lead if it belongs to the current user
        
        # Mock data for now
        mock_lead = {
            "id": lead_id,
            "name": "John Smith",
            "phone": "+1234567890",
            "email": "john@example.com",
            "car_interest": "Toyota Camry",
            "source": "Website",
            "status": "New",
            "created_at": "2024-01-15T10:00:00Z"
        }
        
        return {
            "success": True,
            "lead": mock_lead
        }
        
    except Exception as e:
        logger.error(f"Get lead error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
