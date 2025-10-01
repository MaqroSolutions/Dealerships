"""
Telnyx Messaging API routes for sending and receiving SMS messages
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import logging
from datetime import datetime
import pytz

from maqro_rag import EnhancedRAGService
from maqro_rag.entity_parser import EntityParser, VehicleQuery
from maqro_rag.db_retriever import DatabaseRAGRetriever
from ...api.deps import get_db_session, get_current_user_id, get_user_dealership_id, get_enhanced_rag_services
from ...core.lifespan import get_db_retriever
from ...services.telnyx_service import telnyx_service
from ...services.salesperson_sms_service import salesperson_sms_service
from ...services.message_flow_service import message_flow_service
from ...services.dealership_phone_mapping import dealership_phone_mapping_service
from ...crud import (
    get_lead_by_phone, 
    create_lead, 
    create_conversation,
    get_all_conversation_history,
    get_user_profile_by_user_id,
    get_salesperson_by_phone,
    create_pending_approval,
    get_pending_approval_by_user,
    update_approval_status,
    is_approval_command,
    parse_approval_command
)
from ...schemas.lead import LeadCreate
from ...services.ai_services import get_last_customer_message

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

# Initialize entity parser for better query understanding
entity_parser = EntityParser()


@router.post("/send-sms")
async def send_telnyx_sms(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """
    Send SMS via Telnyx API
    """
    try:
        body = await request.json()
        to = body.get("to")
        message = body.get("body")
        
        if not to or not message:
            raise HTTPException(status_code=400, detail="Missing 'to' or 'body' parameters")
        
        logger.info(f"Sending Telnyx SMS to {to}: {message}")
        
        # Send SMS via Telnyx service
        result = await telnyx_service.send_sms(to, message)
        
        if result["success"]:
            return {
                "success": True,
                "message_id": result["message_id"],
                "to": to,
                "message": "SMS sent successfully via Telnyx"
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending Telnyx SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS")


 


@router.post("/webhook")
@limiter.limit("200/minute")  # High limit for legitimate webhook traffic
async def telnyx_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    enhanced_rag_service: EnhancedRAGService = Depends(get_enhanced_rag_services),
    db_retriever: DatabaseRAGRetriever = Depends(get_db_retriever)
):
    """
    Telnyx webhook endpoint for receiving inbound SMS messages
    
    This endpoint:
    1. Receives incoming messages from customers via Telnyx
    2. Verifies webhook signature for security
    3. Looks up existing lead by phone number
    4. Creates new lead if phone number doesn't exist
    5. Adds message to conversation history
    6. Generates AI response using RAG system
    7. Sends AI response back to customer via Telnyx
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        signature = request.headers.get("X-Telnyx-Signature", "")
        
        # Verify webhook signature
        if not telnyx_service.verify_webhook_signature(body.decode(), signature):
            logger.warning("Invalid Telnyx webhook signature")
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parse JSON payload
        webhook_data = await request.json()
        logger.info(f"Received Telnyx webhook: {webhook_data}")
        
        # Parse message from webhook
        parsed_message = telnyx_service.parse_webhook_message(webhook_data)
        
        if not parsed_message:
            logger.info("No valid message found in webhook")
            return {"status": "ok", "message": "No message to process"}
        
        # Only process SMS/MMS text messages for now
        if parsed_message.get("message_type") not in ["SMS", "MMS"]:
            logger.info(f"Ignoring non-text message type: {parsed_message.get('message_type')}")
            return {"status": "ok", "message": "Non-text message ignored"}
        
        from_phone = parsed_message.get("from_phone")
        message_text = parsed_message.get("message_text")
        message_type = parsed_message.get("message_type")
        
        if not from_phone or not message_text:
            logger.error("Missing required message data")
            return {"status": "error", "message": "Missing required message data"}
        
        # Normalize phone number
        normalized_phone = telnyx_service.normalize_phone_number(from_phone)
        logger.info(f"Processing {message_type} message from {normalized_phone}: {message_text}")
        
        # Determine which dealership this phone number belongs to
        dealership_id = await dealership_phone_mapping_service.get_dealership_for_phone(
            session=db,
            phone_number=normalized_phone
        )
        
        if not dealership_id:
            logger.error(f"Could not determine dealership for phone {normalized_phone}")
            return {"status": "error", "message": "Unable to determine dealership for this phone number"}
        
        logger.info(f"Determined dealership {dealership_id} for phone {normalized_phone}")
        
        # Use the new message flow service to handle the incoming message
        result = await message_flow_service.process_incoming_message(
            session=db,
            from_phone=normalized_phone,
            message_text=message_text,
            dealership_id=dealership_id,
            enhanced_rag_service=enhanced_rag_service,
            message_source=message_type.lower()
        )
        
        # If this was a salesperson message that needs a response, send it
        if result.get("success") and result.get("message"):
            # Check if we need to send a response back to the salesperson
            if result.get("needs_clarification") or result.get("has_pending_approval") is False:
                # Send response via SMS
                response_result = await telnyx_service.send_sms(normalized_phone, result["message"])
                
                if response_result["success"]:
                    logger.info(f"Sent response to salesperson {normalized_phone} via {message_type}")
                    result["response_sent_to_salesperson"] = True
                else:
                    logger.error(f"Failed to send response to salesperson: {response_result['error']}")
                    result["response_sent_to_salesperson"] = False
                    result["salesperson_response_error"] = response_result["error"]
        
        return result
            
    except Exception as e:
        logger.error(f"Telnyx webhook processing error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"status": "error", "message": f"Internal processing error: {str(e)}"}


@router.get("/message-status/{message_id}")
async def get_message_status(
    message_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get the status of a sent message
    """
    try:
        result = await telnyx_service.get_message_status(message_id)
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting message status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get message status")


@router.get("/webhook-test")
async def test_webhook():
    """
    Test endpoint to verify webhook URL is reachable
    Telnyx may call this to verify your webhook URL
    """
    return {"status": "ok", "message": "Telnyx webhook endpoint is active"}


@router.get("/health")
async def health_check():
    """
    Health check endpoint for Telnyx service
    """
    try:
        # Check if credentials are configured
        if not telnyx_service._validate_credentials():
            return {
                "status": "unhealthy",
                "message": "Telnyx credentials not configured",
                "service": "telnyx"
            }
        
        return {
            "status": "healthy",
            "message": "Telnyx service is operational",
            "service": "telnyx"
        }
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "message": f"Health check failed: {str(e)}",
            "service": "telnyx"
        }
