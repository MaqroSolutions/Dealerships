"""
WhatsApp Business API routes for sending and receiving WhatsApp messages
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
from ...services.whatsapp_service import whatsapp_service
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


@router.get("/webhook")
async def whatsapp_webhook_verify(request: Request):
    """
    WhatsApp webhook verification endpoint
    
    Meta sends GET request with parameters:
    - hub.mode: "subscribe"
    - hub.verify_token: your verify token
    - hub.challenge: challenge string to return
    """
    try:
        mode = request.query_params.get("hub.mode")
        token = request.query_params.get("hub.verify_token")
        challenge = request.query_params.get("hub.challenge")
        
        logger.info(f"Webhook verification: mode={mode}, token_provided={token is not None}")
        
        # Verify the token and return challenge
        verified_challenge = whatsapp_service.verify_webhook_token(mode, token, challenge)
        
        if verified_challenge:
            logger.info("Webhook verification successful")
            return int(verified_challenge)  # Meta expects integer response
        else:
            logger.warning("Webhook verification failed")
            raise HTTPException(status_code=403, detail="Forbidden")
            
    except Exception as e:
        logger.error(f"Webhook verification error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
@limiter.limit("200/minute")  # High limit for legitimate webhook traffic
async def whatsapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    enhanced_rag_service: EnhancedRAGService = Depends(get_enhanced_rag_services),
    db_retriever: DatabaseRAGRetriever = Depends(get_db_retriever)
):
    """
    WhatsApp webhook endpoint for receiving inbound messages
    
    This endpoint:
    1. Receives incoming WhatsApp messages from customers
    2. Verifies webhook signature for security
    3. Looks up existing lead by phone number
    4. Creates new lead if phone number doesn't exist
    5. Adds message to conversation history
    6. Generates AI response using RAG system
    7. Sends AI response back to customer via WhatsApp
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        signature = request.headers.get("X-Hub-Signature-256", "")
        
        # Verify webhook signature
        if not whatsapp_service.verify_webhook_signature(body.decode(), signature):
            logger.warning("Invalid webhook signature")
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parse JSON payload
        webhook_data = await request.json()
        logger.info(f"Received WhatsApp webhook: {webhook_data}")
        
        # Parse message from webhook
        parsed_message = whatsapp_service.parse_webhook_message(webhook_data)
        
        if not parsed_message:
            logger.info("No valid message found in webhook")
            return {"status": "ok", "message": "No message to process"}
        
        # Only process text messages for now
        if parsed_message.get("message_type") != "text":
            logger.info(f"Ignoring non-text message type: {parsed_message.get('message_type')}")
            return {"status": "ok", "message": "Non-text message ignored"}
        
        from_phone = parsed_message.get("from_phone")
        message_text = parsed_message.get("message_text")
        
        if not from_phone or not message_text:
            logger.error("Missing required message data")
            return {"status": "error", "message": "Missing required message data"}
        
        # Normalize phone number
        normalized_phone = whatsapp_service.normalize_phone_number(from_phone)
        logger.info(f"Processing message from {normalized_phone}: {message_text}")
        
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
            message_source="whatsapp"
        )
        
        # If this was a salesperson message that needs a response, send it
        if result.get("success") and result.get("message"):
            # Check if we need to send a response back to the salesperson
            if result.get("needs_clarification") or result.get("has_pending_approval") is False:
                whatsapp_result = await whatsapp_service.send_message(normalized_phone, result["message"])
                
                if whatsapp_result["success"]:
                    logger.info(f"Sent response to salesperson {normalized_phone}")
                    result["response_sent_to_salesperson"] = True
                else:
                    logger.error(f"Failed to send response to salesperson: {whatsapp_result['error']}")
                    result["response_sent_to_salesperson"] = False
                    result["salesperson_response_error"] = whatsapp_result["error"]
        
        return result
            
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"status": "error", "message": f"Internal processing error: {str(e)}"}


@router.post("/send-message")
async def send_whatsapp_message(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """
    Send WhatsApp message via WhatsApp Business API
    Replaces the frontend /api/send-message route
    """
    try:
        body = await request.json()
        to = body.get("to")
        message = body.get("body")
        
        if not to or not message:
            raise HTTPException(status_code=400, detail="Missing 'to' or 'body' parameters")
        
        logger.info(f"Sending WhatsApp message to {to}: {message}")
        
        # Send message via WhatsApp service
        result = await whatsapp_service.send_message(to, message)
        
        if result["success"]:
            return {
                "success": True,
                "message_id": result["message_id"],
                "to": to,
                "message": "WhatsApp message sent successfully"
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")


@router.get("/webhook-test")
async def test_webhook():
    """
    Test endpoint to verify webhook URL is reachable
    WhatsApp may call this to verify your webhook URL
    """
    return {"status": "ok", "message": "WhatsApp webhook endpoint is active"}