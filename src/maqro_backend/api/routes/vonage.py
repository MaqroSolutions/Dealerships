"""
Vonage SMS API routes for sending and receiving SMS messages
"""
from fastapi import APIRouter, Depends, HTTPException, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
import logging
from datetime import datetime
import pytz

from maqro_rag import EnhancedRAGService
from ...api.deps import get_db_session, get_current_user_id, get_user_dealership_id, get_enhanced_rag_services
from ...services.sms_service import sms_service
from ...services.salesperson_sms_service import salesperson_sms_service
from ...services.message_flow_service import message_flow_service
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

router = APIRouter()


@router.post("/send-sms")
async def send_sms(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """
    Send SMS via Vonage API
    Replaces the frontend /api/send-message route
    """
    try:
        body = await request.json()
        to = body.get("to")
        message = body.get("body")
        
        if not to or not message:
            raise HTTPException(status_code=400, detail="Missing 'to' or 'body' parameters")
        
        logger.info(f"Sending SMS to {to}: {message}")
        
        # Send SMS via Vonage service
        result = await sms_service.send_sms(to, message)
        
        if result["success"]:
            return {
                "success": True,
                "message_id": result["message_id"],
                "to": to,
                "message": "SMS sent successfully"
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise HTTPException(status_code=500, detail="Failed to send SMS")


@router.api_route("/webhook", methods=["GET", "POST"])
async def vonage_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    enhanced_rag_service: EnhancedRAGService = Depends(get_enhanced_rag_services)
):
    """
    Vonage webhook endpoint for receiving inbound SMS messages
    
    This endpoint:
    1. Receives incoming SMS from customers
    2. Looks up existing lead by phone number
    3. Creates new lead if phone number doesn't exist
    4. Adds message to conversation history
    5. Generates AI response using RAG system
    6. Sends AI response back to customer
    """
    try:
        # Handle both GET (query params) and POST (form data) requests
        if request.method == "GET":
            # Vonage sends data as query parameters
            from_number = request.query_params.get("msisdn")
            to_number = request.query_params.get("to")
            message_text = request.query_params.get("text")
            message_id = request.query_params.get("messageId")
        else:
            # POST - Vonage sends form data
            form_data = await request.form()
            from_number = form_data.get("msisdn")
            to_number = form_data.get("to")
            message_text = form_data.get("text")
            message_id = form_data.get("messageId")
        
        logger.info(f"Received webhook: from={from_number}, to={to_number}, text={message_text}")
        
        if not from_number or not message_text:
            logger.error("Missing required webhook parameters")
            return {"status": "error", "message": "Missing required parameters"}
        
        # Normalize phone number
        normalized_phone = sms_service.normalize_phone_number(from_number)
        
        # Use specific dealership ID for testing
        default_dealership_id = "d660c7d6-99e2-4fa8-b99b-d221def53d20"
        
        # Use the new message flow service to handle the incoming message
        result = await message_flow_service.process_incoming_message(
            session=db,
            from_phone=normalized_phone,
            message_text=message_text,
            dealership_id=default_dealership_id,
            enhanced_rag_service=enhanced_rag_service,
            message_source="sms"
        )
        
        # If this was a salesperson message that needs a response, send it
        if result.get("success") and result.get("message"):
            # Check if we need to send a response back to the salesperson
            if result.get("needs_clarification") or result.get("has_pending_approval") is False:
                sms_result = await sms_service.send_sms(normalized_phone, result["message"])
                
                if sms_result["success"]:
                    logger.info(f"Sent response to salesperson {normalized_phone}")
                    result["response_sent_to_salesperson"] = True
                else:
                    logger.error(f"Failed to send response to salesperson: {sms_result['error']}")
                    result["response_sent_to_salesperson"] = False
                    result["salesperson_response_error"] = sms_result["error"]
        
        return result
            
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"status": "error", "message": f"Internal processing error: {str(e)}"}


@router.api_route("/delivery", methods=["GET", "POST"])
async def vonage_delivery_webhook(request: Request):
    """
    Vonage delivery receipt webhook endpoint
    
    This endpoint receives delivery status updates for outbound SMS messages
    Vonage sends delivery receipts here when SMS messages are delivered, failed, etc.
    """
    try:
        # Handle both GET (query params) and POST (form data) requests
        if request.method == "GET":
            # Vonage sends data as query parameters
            message_id = request.query_params.get("messageId")
            status = request.query_params.get("status")
            err_code = request.query_params.get("err-code")
            to = request.query_params.get("to")
            network_code = request.query_params.get("network-code")
            price = request.query_params.get("price")
        else:
            # POST - Vonage sends form data
            form_data = await request.form()
            message_id = form_data.get("messageId")
            status = form_data.get("status")
            err_code = form_data.get("err-code")
            to = form_data.get("to")
            network_code = form_data.get("network-code")
            price = form_data.get("price")
        
        logger.info(f"Delivery receipt: messageId={message_id}, status={status}, to={to}, err_code={err_code}")
        
        # You can store delivery status in database if needed
        # For now, just log the delivery status
        
        return {"status": "ok", "message": "Delivery receipt processed"}
        
    except Exception as e:
        logger.error(f"Delivery webhook processing error: {e}")
        return {"status": "error", "message": f"Error processing delivery receipt: {str(e)}"}


@router.api_route("/webhook-simple", methods=["GET", "POST"])
async def vonage_simple_webhook(request: Request):
    """
    Simple webhook endpoint for testing Vonage SMS receive/send functionality
    Just receives a message and sends back a simple test response
    """
    try:
        # Handle both GET (query params) and POST (form data) requests
        if request.method == "GET":
            # Vonage sends data as query parameters
            from_number = request.query_params.get("msisdn")
            to_number = request.query_params.get("to")
            message_text = request.query_params.get("text")
            message_id = request.query_params.get("messageId")
        else:
            # POST - Vonage sends form data
            form_data = await request.form()
            from_number = form_data.get("msisdn")
            to_number = form_data.get("to")
            message_text = form_data.get("text")
            message_id = form_data.get("messageId")
        
        logger.info(f"Simple webhook received: from={from_number}, text={message_text}")
        
        if not from_number or not message_text:
            logger.error("Missing required webhook parameters")
            return {"status": "error", "message": "Missing required parameters"}
        
        # Normalize phone number
        normalized_phone = sms_service.normalize_phone_number(from_number)
        
        # Simple test response
        test_response = f"Hello! I received your message: '{message_text}'. This is a test response from the dealership bot."
        
        # Send simple response back to customer via SMS
        sms_result = await sms_service.send_sms(normalized_phone, test_response)
        
        if sms_result["success"]:
            logger.info(f"Sent test response to {normalized_phone}")
            return {
                "status": "success",
                "message": "Test message processed and response sent",
                "from": from_number,
                "response_sent": True,
                "test_response": test_response
            }
        else:
            logger.error(f"Failed to send test response: {sms_result['error']}")
            return {
                "status": "error", 
                "message": "Failed to send response",
                "from": from_number,
                "response_sent": False,
                "error": sms_result["error"]
            }
            
    except Exception as e:
        logger.error(f"Simple webhook processing error: {e}")
        return {"status": "error", "message": f"Processing error: {str(e)}"}


@router.get("/webhook-test")
async def test_webhook():
    """
    Test endpoint to verify webhook URL is reachable
    Vonage may call this to verify your webhook URL
    """
    return {"status": "ok", "message": "Vonage webhook endpoint is active"}