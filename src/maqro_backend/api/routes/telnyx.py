"""
Telnyx SMS API routes for sending messages and handling webhooks
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import logging

from ...db.session import get_db_session
from ...services.telnyx_service import telnyx_service
from ...services.message_flow_service import message_flow_service
from ...services.dealership_phone_mapping_service import dealership_phone_mapping_service
from ...services.enhanced_rag_service import EnhancedRAGService, get_enhanced_rag_services
from ...api.deps import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()

# Rate limiter for webhook endpoints
limiter = RateLimiter(key_func=lambda request: request.client.host)


@router.post("/send-sms")
async def send_sms(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """
    Send SMS message via Telnyx
    
    Request body should contain:
    - to: Recipient phone number
    - message: Message text to send
    """
    try:
        data = await request.json()
        to_phone = data.get("to")
        message_text = data.get("message")
        
        if not to_phone or not message_text:
            raise HTTPException(status_code=400, detail="Missing 'to' or 'message' field")
        
        # Send SMS via Telnyx
        result = await telnyx_service.send_sms(to_phone, message_text)
        
        if result["success"]:
            return {
                "success": True,
                "message": "SMS sent successfully",
                "message_id": result.get("message_id")
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to send SMS"))
            
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS")


@router.post("/webhook")
@limiter.limit("200/minute")  # High limit for legitimate webhook traffic
async def telnyx_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    enhanced_rag_service: EnhancedRAGService = Depends(get_enhanced_rag_services)
):
    """
    Telnyx webhook endpoint for receiving inbound SMS messages
    
    This endpoint:
    1. Receives incoming SMS from customers via Telnyx
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
        normalized_phone = telnyx_service.normalize_phone_number(from_phone)
        logger.info(f"Processing message from {normalized_phone}: {message_text}")
        
        # Determine which dealership this phone number belongs to
        dealership_id = await dealership_phone_mapping_service.get_dealership_by_phone(
            session=db,
            phone_number=normalized_phone
        )
        
        if not dealership_id:
            logger.error(f"Could not determine dealership for phone {normalized_phone}")
            return {"status": "error", "message": "Unable to determine dealership for this phone number"}
        
        logger.info(f"Determined dealership {dealership_id} for phone {normalized_phone}")
        
        # Use the message flow service to handle the incoming message
        result = await message_flow_service.process_incoming_message(
            session=db,
            from_phone=normalized_phone,
            message_text=message_text,
            dealership_id=dealership_id,
            enhanced_rag_service=enhanced_rag_service,
            message_source="telnyx_sms"
        )
        
        # If this was a salesperson message that needs a response, send it
        if result.get("success") and result.get("message"):
            # Check if we need to send a response back to the salesperson
            if result.get("needs_clarification") or result.get("has_pending_approval") is False:
                sms_result = await telnyx_service.send_sms(normalized_phone, result["message"])
                
                if sms_result["success"]:
                    logger.info(f"Sent response to salesperson {normalized_phone}")
                    result["response_sent_to_salesperson"] = True
                else:
                    logger.error(f"Failed to send response to salesperson: {sms_result['error']}")
                    result["response_sent_to_salesperson"] = False
                    result["salesperson_response_error"] = sms_result["error"]
        
        return result
            
    except Exception as e:
        logger.error(f"Error processing Telnyx webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/webhook")
async def telnyx_webhook_verify(request: Request):
    """
    Telnyx webhook verification endpoint (if needed)
    
    Some webhook providers require GET verification
    """
    try:
        # Telnyx typically doesn't require GET verification like WhatsApp
        # but we'll provide a basic endpoint in case it's needed
        logger.info("Telnyx webhook verification requested")
        return {"status": "ok", "message": "Webhook endpoint is active"}
        
    except Exception as e:
        logger.error(f"Webhook verification error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
