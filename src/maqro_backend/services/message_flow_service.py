"""
Message Flow Service for handling the new approval-based message flow

This service implements the new flow where:
1. Customer messages go to RAG and generate responses
2. Responses are sent to salesperson for approval
3. Salesperson can approve (YES), reject (NO), edit (EDIT), or force send (FORCE)
"""
import logging
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import pytz

from ..crud import (
    get_lead_by_phone,
    create_lead,
    create_conversation,
    get_all_conversation_history,
    get_user_profile_by_user_id,
    get_salesperson_by_phone,
    create_pending_approval,
    get_pending_approval_by_user,
    update_approval_status,
    expire_pending_approvals_for_user
)
from ..schemas.lead import LeadCreate
from maqro_rag import EnhancedRAGService

logger = logging.getLogger(__name__)


class MessageFlowService:
    """Service for handling the new approval-based message flow"""
    
    def __init__(self):
        """Initialize message flow service"""
        pass
    
    async def process_incoming_message(
        self,
        session: AsyncSession,
        from_phone: str,
        message_text: str,
        dealership_id: str,
        enhanced_rag_service: EnhancedRAGService,
        message_source: str = "sms"  # "sms" or "whatsapp"
    ) -> Dict[str, Any]:
        """
        Process incoming message and determine the appropriate flow
        
        Args:
            session: Database session
            from_phone: Phone number of the sender
            message_text: Message content
            dealership_id: Dealership ID
            enhanced_rag_service: RAG service for generating responses
            message_source: Source of the message ("sms" or "whatsapp")
            
        Returns:
            Dict with processing results
        """
        try:
            # First, check if this is a salesperson with a pending approval
            salesperson_profile = await get_salesperson_by_phone(
                session=session,
                phone=from_phone,
                dealership_id=dealership_id
            )
            
            if salesperson_profile:
                logger.info(f"Found salesperson {salesperson_profile.user_id}, checking for pending approval")
                return await self._handle_salesperson_message(
                    session=session,
                    salesperson_profile=salesperson_profile,
                    message_text=message_text,
                    dealership_id=dealership_id,
                    enhanced_rag_service=enhanced_rag_service,
                    message_source=message_source
                )
            
            # If not a salesperson, this is a customer message
            logger.info(f"Processing customer message from {from_phone}")
            return await self._handle_customer_message(
                session=session,
                from_phone=from_phone,
                message_text=message_text,
                dealership_id=dealership_id,
                enhanced_rag_service=enhanced_rag_service,
                message_source=message_source
            )
            
        except Exception as e:
            logger.error(f"Error processing incoming message: {e}")
            return {
                "success": False,
                "error": "Processing error",
                "message": "Sorry, there was an error processing your message. Please try again."
            }
    
    async def _handle_salesperson_message(
        self,
        session: AsyncSession,
        salesperson_profile: Any,
        message_text: str,
        dealership_id: str,
        enhanced_rag_service: EnhancedRAGService,
        message_source: str
    ) -> Dict[str, Any]:
        """Handle message from a salesperson"""
        try:
            # Check if they have a pending approval
            pending_approval = await get_pending_approval_by_user(
                session=session,
                user_id=str(salesperson_profile.user_id),
                dealership_id=dealership_id
            )
            
            if pending_approval:
                logger.info(f"Found pending approval {pending_approval.id}, processing salesperson response")
                return await self._process_approval_response(
                    session=session,
                    salesperson_profile=salesperson_profile,
                    pending_approval=pending_approval,
                    message_text=message_text,
                    message_source=message_source,
                    enhanced_rag_service=enhanced_rag_service
                )
            else:
                # No pending approval - this is a regular salesperson message
                logger.info(f"No pending approval for salesperson {salesperson_profile.user_id}")
                return {
                    "success": True,
                    "message": "No pending approvals. You can continue with your regular sales activities.",
                    "has_pending_approval": False
                }
                
        except Exception as e:
            logger.error(f"Error handling salesperson message: {e}")
            return {
                "success": False,
                "error": "Salesperson message processing error",
                "message": "Sorry, there was an error processing your message. Please try again."
            }
    
    async def _process_approval_response(
        self,
        session: AsyncSession,
        salesperson_profile: Any,
        pending_approval: Any,
        message_text: str,
        message_source: str,
        enhanced_rag_service: EnhancedRAGService
    ) -> Dict[str, Any]:
        """Process salesperson's response to a pending approval"""
        try:
            message_lower = message_text.lower().strip()
            
            # Handle YES - approve and send the generated response
            if message_lower in ["yes", "y", "send", "approve", "ok", "okay", "👍", "✅", "send it", "looks good", "good", "go ahead", "approve it"]:
                logger.info(f"Salesperson approved response for approval {pending_approval.id}")
                return await self._approve_and_send_response(
                    session=session,
                    pending_approval=pending_approval,
                    message_source=message_source
                )
            
            # Handle NO - reject the response
            elif message_lower in ["no", "n", "reject", "cancel", "skip", "👎", "❌", "don't send", "do not send", "reject it", "cancel it", "skip it", "no thanks"]:
                logger.info(f"Salesperson rejected response for approval {pending_approval.id}")
                return await self._reject_response(
                    session=session,
                    pending_approval=pending_approval
                )
            
            # Handle EDIT - regenerate response with salesperson's edits
            elif message_lower.startswith("edit"):
                logger.info(f"Salesperson requested edit for approval {pending_approval.id}")
                return await self._edit_and_regenerate_response(
                    session=session,
                    salesperson_profile=salesperson_profile,
                    pending_approval=pending_approval,
                    edit_instructions=message_text[4:].strip(),  # Remove "EDIT" prefix
                    enhanced_rag_service=enhanced_rag_service,
                    message_source=message_source
                )
            
            # Handle FORCE - send custom message directly to customer
            elif message_lower.startswith("force"):
                logger.info(f"Salesperson requested force send for approval {pending_approval.id}")
                return await self._force_send_custom_message(
                    session=session,
                    pending_approval=pending_approval,
                    custom_message=message_text[5:].strip(),  # Remove "FORCE" prefix
                    message_source=message_source
                )
            
            # Unknown command
            else:
                help_message = (
                    "I didn't understand your response. Here are your options:\n\n"
                    "• Reply 'YES' to send the suggested response to the customer\n"
                    "• Reply 'NO' to reject the response\n"
                    "• Reply 'EDIT [your instructions]' to have me regenerate the response\n"
                    "• Reply 'FORCE [your message]' to send your custom message directly"
                )
                
                return {
                    "success": True,
                    "message": help_message,
                    "approval_id": str(pending_approval.id),
                    "needs_clarification": True
                }
                
        except Exception as e:
            logger.error(f"Error processing approval response: {e}")
            return {
                "success": False,
                "error": "Approval processing error",
                "message": "Sorry, there was an error processing your approval response. Please try again."
            }
    
    async def _approve_and_send_response(
        self,
        session: AsyncSession,
        pending_approval: Any,
        message_source: str
    ) -> Dict[str, Any]:
        """Approve and send the generated response to the customer"""
        try:
            # Import the appropriate service based on message source
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    pending_approval.customer_phone,
                    pending_approval.generated_response
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    pending_approval.customer_phone,
                    pending_approval.generated_response
                )
            
            if send_result["success"]:
                # Update approval status
                await update_approval_status(
                    session=session,
                    approval_id=str(pending_approval.id),
                    status="approved"
                )
                
                # Save agent response to conversation history
                await create_conversation(
                    session=session,
                    lead_id=str(pending_approval.lead_id),
                    message=pending_approval.generated_response,
                    sender="agent"
                )
                
                logger.info(f"Response approved and sent to customer {pending_approval.customer_phone}")
                
                return {
                    "success": True,
                    "message": "✅ Response approved and sent to customer!",
                    "approval_id": str(pending_approval.id),
                    "sent_to_customer": True,
                    "customer_phone": pending_approval.customer_phone
                }
            else:
                logger.error(f"Failed to send approved response: {send_result['error']}")
                return {
                    "success": False,
                    "error": "Failed to send response",
                    "message": f"Response was approved but failed to send to customer: {send_result['error']}",
                    "approval_id": str(pending_approval.id),
                    "sent_to_customer": False
                }
                
        except Exception as e:
            logger.error(f"Error approving and sending response: {e}")
            return {
                "success": False,
                "error": "Approval error",
                "message": "Sorry, there was an error sending the approved response. Please try again."
            }
    
    async def _reject_response(
        self,
        session: AsyncSession,
        pending_approval: Any
    ) -> Dict[str, Any]:
        """Reject the generated response"""
        try:
            # Update approval status
            await update_approval_status(
                session=session,
                approval_id=str(pending_approval.id),
                status="rejected"
            )
            
            logger.info(f"Response rejected for approval {pending_approval.id}")
            
            return {
                "success": True,
                "message": "❌ Response rejected. No message was sent to the customer.",
                "approval_id": str(pending_approval.id),
                "sent_to_customer": False
            }
            
        except Exception as e:
            logger.error(f"Error rejecting response: {e}")
            return {
                "success": False,
                "error": "Rejection error",
                "message": "Sorry, there was an error rejecting the response. Please try again."
            }
    
    async def _edit_and_regenerate_response(
        self,
        session: AsyncSession,
        salesperson_profile: Any,
        pending_approval: Any,
        edit_instructions: str,
        enhanced_rag_service: EnhancedRAGService,
        message_source: str
    ) -> Dict[str, Any]:
        """Regenerate response based on salesperson's edit instructions"""
        try:
            if not edit_instructions:
                return {
                    "success": False,
                    "error": "Missing edit instructions",
                    "message": "Please provide specific instructions for the edit. Example: 'EDIT Make it more friendly and mention our financing options'"
                }
            
            # Get conversation history for context
            all_conversations_raw = await get_all_conversation_history(
                session=session,
                lead_id=str(pending_approval.lead_id)
            )
            
            # Convert to format expected by RAG service
            all_conversations = [
                {
                    "id": str(conv.id),
                    "message": conv.message,
                    "sender": conv.sender,
                    "created_at": conv.created_at.isoformat() if conv.created_at else None
                }
                for conv in all_conversations_raw
            ]
            
            # Create enhanced prompt with edit instructions
            enhanced_prompt = f"{pending_approval.customer_message}\n\nSalesperson edit request: {edit_instructions}"
            
            # Generate new response using RAG
            vehicles = enhanced_rag_service.search_vehicles_with_context(
                enhanced_prompt,
                all_conversations,
                top_k=3
            )
            
            # Generate enhanced AI response with edit instructions
            enhanced_response = enhanced_rag_service.generate_enhanced_response(
                enhanced_prompt,
                vehicles,
                all_conversations,
                "Customer"  # Generic name for context
            )
            
            new_response_text = enhanced_response['response_text']
            
            # Create new pending approval with the edited response
            new_pending_approval = await create_pending_approval(
                session=session,
                lead_id=str(pending_approval.lead_id),
                user_id=str(pending_approval.user_id),
                customer_message=pending_approval.customer_message,
                generated_response=new_response_text,
                customer_phone=pending_approval.customer_phone,
                dealership_id=str(pending_approval.dealership_id)
            )
            
            # Mark old approval as expired
            await update_approval_status(
                session=session,
                approval_id=str(pending_approval.id),
                status="expired"
            )
            
            # Send new response for approval
            approval_message = (
                f"🔄 Response edited and regenerated!\n\n"
                f"Customer: {pending_approval.customer_message}\n\n"
                f"Edit instructions: {edit_instructions}\n\n"
                f"New suggested reply: {new_response_text}\n\n"
                f"📱 Reply 'YES' to send, 'NO' to reject, or 'EDIT [instructions]' to edit again."
            )
            
            # Send approval message to salesperson
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    salesperson_profile.phone,
                    approval_message
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    salesperson_profile.phone,
                    approval_message
                )
            
            if send_result["success"]:
                logger.info(f"Created new pending approval {new_pending_approval.id} with edited response")
                
                return {
                    "success": True,
                    "message": "🔄 Response edited and regenerated! Please review the new response above.",
                    "approval_id": str(new_pending_approval.id),
                    "old_approval_id": str(pending_approval.id),
                    "edit_instructions": edit_instructions,
                    "new_response": new_response_text
                }
            else:
                logger.error(f"Failed to send edit approval message: {send_result['error']}")
                return {
                    "success": False,
                    "error": "Failed to send edit approval",
                    "message": f"Response was edited but failed to send approval message: {send_result['error']}",
                    "approval_id": str(new_pending_approval.id)
                }
                
        except Exception as e:
            logger.error(f"Error editing and regenerating response: {e}")
            return {
                "success": False,
                "error": "Edit error",
                "message": "Sorry, there was an error editing the response. Please try again."
            }
    
    async def _force_send_custom_message(
        self,
        session: AsyncSession,
        pending_approval: Any,
        custom_message: str,
        message_source: str
    ) -> Dict[str, Any]:
        """Force send a custom message from the salesperson directly to the customer"""
        try:
            if not custom_message:
                return {
                    "success": False,
                    "error": "Missing custom message",
                    "message": "Please provide a message to send. Example: 'FORCE Hi John, I'll call you in 5 minutes to discuss the Toyota Camry.'"
                }
            
            # Send custom message to customer
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    pending_approval.customer_phone,
                    custom_message
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    pending_approval.customer_phone,
                    custom_message
                )
            
            if send_result["success"]:
                # Update approval status
                await update_approval_status(
                    session=session,
                    approval_id=str(pending_approval.id),
                    status="force_sent"
                )
                
                # Save custom message to conversation history
                await create_conversation(
                    session=session,
                    lead_id=str(pending_approval.lead_id),
                    message=custom_message,
                    sender="agent"
                )
                
                logger.info(f"Custom message force-sent to customer {pending_approval.customer_phone}")
                
                return {
                    "success": True,
                    "message": "🚀 Custom message sent directly to customer!",
                    "approval_id": str(pending_approval.id),
                    "sent_to_customer": True,
                    "custom_message": custom_message,
                    "customer_phone": pending_approval.customer_phone
                }
            else:
                logger.error(f"Failed to send custom message: {send_result['error']}")
                return {
                    "success": False,
                    "error": "Failed to send custom message",
                    "message": f"Failed to send custom message to customer: {send_result['error']}",
                    "approval_id": str(pending_approval.id),
                    "sent_to_customer": False
                }
                
        except Exception as e:
            logger.error(f"Error force-sending custom message: {e}")
            return {
                "success": False,
                "error": "Force send error",
                "message": "Sorry, there was an error sending your custom message. Please try again."
            }
    
    async def _handle_customer_message(
        self,
        session: AsyncSession,
        from_phone: str,
        message_text: str,
        dealership_id: str,
        enhanced_rag_service: EnhancedRAGService,
        message_source: str
    ) -> Dict[str, Any]:
        """Handle message from a customer"""
        try:
            # Check if this is an existing lead
            existing_lead = await get_lead_by_phone(
                session=session,
                phone=from_phone,
                dealership_id=dealership_id
            )
            
            if existing_lead:
                logger.info(f"Found existing lead: {existing_lead.name} ({existing_lead.id})")
                lead = existing_lead
            else:
                # Create new lead
                logger.info(f"Creating new lead for phone number: {from_phone}")
                lead = await self._create_lead_from_message(
                    session=session,
                    from_phone=from_phone,
                    message_text=message_text,
                    dealership_id=dealership_id,
                    message_source=message_source
                )
            
            # Add customer message to conversation history
            await create_conversation(
                session=session,
                lead_id=str(lead.id),
                message=message_text,
                sender="customer"
            )
            
            # Generate RAG response
            rag_response = await self._generate_rag_response(
                session=session,
                lead=lead,
                message_text=message_text,
                enhanced_rag_service=enhanced_rag_service
            )
            
            if not rag_response["success"]:
                return rag_response
            
            # If lead has an assigned salesperson, send for approval
            if lead.user_id:
                return await self._send_for_approval(
                    session=session,
                    lead=lead,
                    customer_message=message_text,
                    generated_response=rag_response["response_text"],
                    customer_phone=from_phone,
                    dealership_id=dealership_id,
                    message_source=message_source
                )
            else:
                # No assigned salesperson - send response directly to customer
                return await self._send_direct_response(
                    session=session,
                    lead=lead,
                    response_text=rag_response["response_text"],
                    customer_phone=from_phone,
                    message_source=message_source
                )
                
        except Exception as e:
            logger.error(f"Error handling customer message: {e}")
            return {
                "success": False,
                "error": "Customer message processing error",
                "message": "Sorry, there was an error processing your message. Please try again."
            }
    
    async def _create_lead_from_message(
        self,
        session: AsyncSession,
        from_phone: str,
        message_text: str,
        dealership_id: str,
        message_source: str
    ) -> Any:
        """Create a new lead from an incoming message"""
        # Extract information from message if possible
        extracted_name = None
        extracted_car = "Unknown"
        
        # Simple extraction patterns
        message_lower = message_text.lower()
        if "my name is" in message_lower:
            try:
                name_part = message_text[message_lower.find("my name is") + 11:].strip()
                extracted_name = name_part.split()[0] if name_part else None
            except:
                pass
        
        # Extract car interest
        car_keywords = ["toyota", "honda", "ford", "bmw", "mercedes", "audi", "lexus", "nissan", "mazda"]
        for keyword in car_keywords:
            if keyword in message_lower:
                extracted_car = keyword.title()
                break
        
        lead_data = LeadCreate(
            name=extracted_name,
            phone=from_phone,
            email=None,
            car_interest=extracted_car,
            source=message_source.title(),
            message=message_text
        )
        
        # Use default user ID for testing (you can make this configurable)
        default_user_id = "d245e4bb-91ae-4ec4-ad0f-18307b38daa6"
        
        lead = await create_lead(
            session=session,
            lead_in=lead_data,
            user_id=default_user_id,
            dealership_id=dealership_id
        )
        
        logger.info(f"Created new lead: {lead.id}")
        return lead
    
    async def _generate_rag_response(
        self,
        session: AsyncSession,
        lead: Any,
        message_text: str,
        enhanced_rag_service: EnhancedRAGService
    ) -> Dict[str, Any]:
        """Generate RAG response for customer message"""
        try:
            # Get conversation history for AI response
            all_conversations_raw = await get_all_conversation_history(
                session=session,
                lead_id=str(lead.id)
            )
            
            # Convert SQLAlchemy objects to dictionaries for RAG service
            all_conversations = [
                {
                    "id": str(conv.id),
                    "message": conv.message,
                    "sender": conv.sender,
                    "created_at": conv.created_at.isoformat() if conv.created_at else None
                }
                for conv in all_conversations_raw
            ]
            
            # Use enhanced RAG system to find relevant vehicles
            vehicles = enhanced_rag_service.search_vehicles_with_context(
                message_text,
                all_conversations,
                top_k=3
            )
            
            # Generate enhanced AI response
            enhanced_response = enhanced_rag_service.generate_enhanced_response(
                message_text,
                vehicles,
                all_conversations,
                lead.name
            )
            
            return {
                "success": True,
                "response_text": enhanced_response['response_text'],
                "vehicles_found": len(vehicles)
            }
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {e}")
            return {
                "success": False,
                "error": "RAG generation error",
                "message": "Sorry, there was an error generating a response. Please try again."
            }
    
    async def _send_for_approval(
        self,
        session: AsyncSession,
        lead: Any,
        customer_message: str,
        generated_response: str,
        customer_phone: str,
        dealership_id: str,
        message_source: str
    ) -> Dict[str, Any]:
        """Send RAG response to salesperson for approval"""
        try:
            # Get the assigned user's phone number
            assigned_user = await get_user_profile_by_user_id(
                session=session,
                user_id=str(lead.user_id)
            )
            
            if not assigned_user or not assigned_user.phone:
                logger.warning(f"Assigned user {lead.user_id} not found or has no phone number")
                return {
                    "success": False,
                    "error": "Assigned user not found",
                    "message": "Lead has assigned user but no phone number found for approval."
                }
            
            # Create pending approval
            pending_approval = await create_pending_approval(
                session=session,
                lead_id=str(lead.id),
                user_id=str(lead.user_id),
                customer_message=customer_message,
                generated_response=generated_response,
                customer_phone=customer_phone,
                dealership_id=dealership_id
            )
            
            # Send verification message to salesperson
            verification_message = (
                f"📱 New customer message from {lead.name} ({customer_phone}):\n\n"
                f"Customer: {customer_message}\n\n"
                f"🤖 AI Suggested Reply:\n{generated_response}\n\n"
                f"📋 Reply with:\n"
                f"• 'YES' to send this response\n"
                f"• 'NO' to reject it\n"
                f"• 'EDIT [instructions]' to have me improve it\n"
                f"• 'FORCE [your message]' to send your own message"
            )
            
            # Send approval message to salesperson
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    assigned_user.phone,
                    verification_message
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    assigned_user.phone,
                    verification_message
                )
            
            if send_result["success"]:
                logger.info(f"Created pending approval {pending_approval.id} and sent to user {lead.user_id}")
                
                return {
                    "success": True,
                    "message": "RAG response sent to assigned salesperson for approval",
                    "lead_id": str(lead.id),
                    "approval_id": str(pending_approval.id),
                    "sent_to": assigned_user.phone,
                    "response_sent": True,
                    "rag_response": generated_response
                }
            else:
                logger.error(f"Failed to send verification message to user: {send_result['error']}")
                return {
                    "success": False,
                    "error": "Failed to send verification message",
                    "message": "Failed to send verification message to assigned salesperson",
                    "lead_id": str(lead.id),
                    "approval_id": str(pending_approval.id),
                    "error": send_result["error"]
                }
                
        except Exception as e:
            logger.error(f"Error sending for approval: {e}")
            return {
                "success": False,
                "error": "Approval error",
                "message": "Sorry, there was an error sending the response for approval."
            }
    
    async def _send_direct_response(
        self,
        session: AsyncSession,
        lead: Any,
        response_text: str,
        customer_phone: str,
        message_source: str
    ) -> Dict[str, Any]:
        """Send RAG response directly to customer (no assigned salesperson)"""
        try:
            # Save AI response to database
            await create_conversation(
                session=session,
                lead_id=str(lead.id),
                message=response_text,
                sender="agent"
            )
            
            # Send AI response to customer
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    customer_phone,
                    response_text
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    customer_phone,
                    response_text
                )
            
            if send_result["success"]:
                logger.info(f"Sent AI response directly to customer {customer_phone}")
                
                return {
                    "success": True,
                    "message": "Message processed and response sent directly to customer",
                    "lead_id": str(lead.id),
                    "response_sent": True,
                    "sent_directly": True
                }
            else:
                logger.error(f"Failed to send AI response: {send_result['error']}")
                return {
                    "success": False,
                    "error": "Failed to send response",
                    "message": "Message processed but response failed to send",
                    "lead_id": str(lead.id),
                    "response_sent": False,
                    "error": send_result["error"]
                }
                
        except Exception as e:
            logger.error(f"Error sending direct response: {e}")
            return {
                "success": False,
                "error": "Direct response error",
                "message": "Sorry, there was an error sending the response to the customer."
            }


# Global instance
message_flow_service = MessageFlowService()
