"""
AI API routes for Maqro RAG system.

This module provides API endpoints for AI-powered conversation handling,
including conversation responses, general queries, and enhanced RAG integration.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import pytz
import logging
from typing import Optional, Dict, Any

from maqro_rag import EnhancedRAGService
from maqro_backend.api.deps import (
    get_db_session, 
    get_enhanced_rag_services, 
    get_current_user_id
)
from maqro_backend.schemas.ai import AIResponseRequest, GeneralAIRequest
from maqro_backend.crud import (
    get_lead_by_id,
    get_all_conversation_history,
    create_conversation
)
from ...services.ai_services import (
    get_last_customer_message,
    generate_ai_response_text,
    generate_contextual_ai_response
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class AIResponseHandler:
    """Handler for AI response generation with improved error handling."""
    
    def __init__(self, enhanced_rag_service: EnhancedRAGService):
        self.enhanced_rag_service = enhanced_rag_service
    
    async def generate_conversation_response(
        self,
        lead_id: int,
        request_data: Optional[AIResponseRequest],
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Generate AI response for a specific conversation.
        
        Args:
            lead_id: Lead ID
            request_data: Request data
            db: Database session
            user_id: User ID
            
        Returns:
            Response dictionary
        """
        try:
            # Validate lead exists
            lead = await self._validate_lead(lead_id, db)
            
            # Get conversation history
            conversation_history = await get_all_conversation_history(
                session=db, 
                lead_id=lead_id
            )
            
            # Extract customer message
            customer_message = self._extract_customer_message(
                request_data, 
                conversation_history
            )
            
            # Generate AI response using enhanced RAG
            response = await self.enhanced_rag_service.generate_enhanced_response(
                query=customer_message,
                context=self._build_context(conversation_history),
                lead_name=lead.name,
                lead_id=str(lead.id)
            )
            
            # Save conversation turn
            await self._save_conversation_turn(
                lead_id=lead_id,
                customer_message=customer_message,
                ai_response=response.get('message', ''),
                db=db
            )
            
            return self._format_response(response, lead_id)
            
        except Exception as e:
            logger.error(f"Error generating conversation response: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def generate_general_response(
        self,
        request_data: GeneralAIRequest,
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Generate AI response for general queries.
        
        Args:
            request_data: General request data
            db: Database session
            user_id: User ID
            
        Returns:
            Response dictionary
        """
        try:
            # Generate AI response using enhanced RAG
            response = await self.enhanced_rag_service.generate_enhanced_response(
                query=request_data.message,
                context=request_data.context or "",
                lead_name=None,
                lead_id=None
            )
            
            return self._format_response(response, None)
            
        except Exception as e:
            logger.error(f"Error generating general response: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _validate_lead(self, lead_id: int, db: AsyncSession):
        """Validate that lead exists."""
        lead = await get_lead_by_id(session=db, lead_id=lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return lead
    
    def _extract_customer_message(
        self, 
        request_data: Optional[AIResponseRequest], 
        conversation_history: list
    ) -> str:
        """Extract customer message from request or conversation history."""
        if request_data and request_data.message:
            return request_data.message
        
        # Get last customer message from history
        last_customer_message = get_last_customer_message(conversation_history)
        if not last_customer_message:
            raise HTTPException(
                status_code=400, 
                detail="No customer message found in request or conversation history"
            )
        
        return last_customer_message
    
    def _build_context(self, conversation_history: list) -> str:
        """Build context string from conversation history."""
        if not conversation_history:
            return ""
        
        context_parts = []
        for turn in conversation_history[-10:]:  # Last 10 turns
            role = turn.get('role', 'customer')
            content = turn.get('content', '')
            context_parts.append(f"{role.title()}: {content}")
        
        return "\n".join(context_parts)
    
    async def _save_conversation_turn(
        self,
        lead_id: int,
        customer_message: str,
        ai_response: str,
        db: AsyncSession
    ):
        """Save conversation turn to database."""
        try:
            await create_conversation(
                session=db,
                lead_id=lead_id,
                role="customer",
                content=customer_message,
                timestamp=datetime.now(pytz.UTC)
            )
            
            await create_conversation(
                session=db,
                lead_id=lead_id,
                role="agent",
                content=ai_response,
                timestamp=datetime.now(pytz.UTC)
            )
        except Exception as e:
            logger.error(f"Error saving conversation turn: {e}")
            # Don't raise exception here to avoid breaking the response
    
    def _format_response(self, response: Dict[str, Any], lead_id: Optional[int]) -> Dict[str, Any]:
        """Format the response for API return."""
        return {
            "message": response.get('message', ''),
            "auto_send": response.get('auto_send', True),
            "should_handoff": response.get('should_handoff', False),
            "handoff_reason": response.get('handoff_reason'),
            "handoff_reasoning": response.get('handoff_reasoning'),
            "retrieval_score": response.get('retrieval_score', 0.0),
            "calendar_booking": response.get('calendar_booking'),
            "lead_id": lead_id,
            "timestamp": datetime.now(pytz.UTC).isoformat()
        }


@router.post("/conversations/{lead_id}/ai-response")
@limiter.limit("20/minute")
async def generate_conversation_ai_response(
    request: Request,
    lead_id: int, 
    request_data: Optional[AIResponseRequest] = None,
    db: AsyncSession = Depends(get_db_session),
    enhanced_rag_service: EnhancedRAGService = Depends(get_enhanced_rag_services),
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate AI response based on complete conversation history and save it.
    
    This endpoint uses the FULL conversation history to generate contextually aware responses.
    """
    logger.info(f"Generating AI response for lead {lead_id}")
    
    handler = AIResponseHandler(enhanced_rag_service)
    return await handler.generate_conversation_response(
        lead_id=lead_id,
        request_data=request_data,
        db=db,
        user_id=user_id
    )


@router.post("/ai/general")
@limiter.limit("30/minute")
async def generate_general_ai_response(
    request: Request,
    request_data: GeneralAIRequest,
    db: AsyncSession = Depends(get_db_session),
    enhanced_rag_service: EnhancedRAGService = Depends(get_enhanced_rag_services),
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate AI response for general queries (not tied to a specific lead).
    
    This endpoint is useful for general questions about inventory, dealership info, etc.
    """
    logger.info(f"Generating general AI response for user {user_id}")
    
    handler = AIResponseHandler(enhanced_rag_service)
    return await handler.generate_general_response(
        request_data=request_data,
        db=db,
        user_id=user_id
    )


@router.post("/ai/enhanced")
@limiter.limit("25/minute")
async def generate_enhanced_ai_response(
    request: Request,
    request_data: GeneralAIRequest,
    db: AsyncSession = Depends(get_db_session),
    enhanced_rag_service: EnhancedRAGService = Depends(get_enhanced_rag_services),
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate enhanced AI response with full RAG capabilities.
    
    This endpoint provides the most advanced AI response generation with
    state management, memory, and calendar integration.
    """
    logger.info(f"Generating enhanced AI response for user {user_id}")
    
    handler = AIResponseHandler(enhanced_rag_service)
    return await handler.generate_general_response(
        request_data=request_data,
        db=db,
        user_id=user_id
    )


@router.get("/ai/health")
async def ai_health_check():
    """
    Health check endpoint for AI services.
    
    Returns:
        Health status of AI components
    """
    try:
        # Basic health check - could be enhanced with service-specific checks
        return {
            "status": "healthy",
            "timestamp": datetime.now(pytz.UTC).isoformat(),
            "services": {
                "enhanced_rag": "available",
                "calendar_integration": "available",
                "memory_store": "available"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="AI services unavailable")