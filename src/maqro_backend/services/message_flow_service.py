"""
Message Flow Service for handling the new approval-based message flow

This service implements the new flow where:
1. Customer messages go to RAG and generate responses
2. Responses are sent to salesperson for approval
3. Salesperson can approve (YES), reject (NO), edit (EDIT), or force send (FORCE)
4. Salesperson messages are processed for lead creation and inventory updates
"""
import logging
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
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
from .salesperson_sms_service import salesperson_sms_service

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
                # Process it for lead creation, inventory updates, or other salesperson functions
                logger.info(f"Processing salesperson message for lead/inventory management: {salesperson_profile.user_id}")
                return await self._process_salesperson_business_message(
                    session=session,
                    salesperson_profile=salesperson_profile,
                    message_text=message_text,
                    dealership_id=dealership_id,
                    message_source=message_source
                )
                
        except Exception as e:
            logger.error(f"Error handling salesperson message: {e}")
            return {
                "success": False,
                "error": "Salesperson message processing error",
                "message": "Sorry, there was an error processing your message. Please try again."
            }
    
    async def _process_salesperson_business_message(
        self,
        session: AsyncSession,
        salesperson_profile: Any,
        message_text: str,
        dealership_id: str,
        message_source: str
    ) -> Dict[str, Any]:
        """Process salesperson message for lead creation, inventory updates, or other business functions"""
        try:
            logger.info(f"Processing business message from salesperson {salesperson_profile.user_id}: {message_text}")
            
            # Use the salesperson SMS service to handle lead creation and inventory updates
            result = await salesperson_sms_service.process_salesperson_message(
                session=session,
                from_number=salesperson_profile.phone,
                message_text=message_text,
                dealership_id=dealership_id
            )
            
            if result.get("success"):
                logger.info(f"Successfully processed salesperson business message: {result.get('message', 'No message')}")
                
                # Check if the business function created something with incomplete information
                has_incomplete_info = result.get("has_incomplete_info", False)
                business_function = result.get("business_function", "unknown")
                
                response_message = result.get("message", "Message processed successfully")
                if has_incomplete_info:
                    response_message += "\n\n⚠️ Note: Some information was incomplete. Please update the record with additional details when possible."
                
                return {
                    "success": True,
                    "message": response_message,
                    "has_pending_approval": False,
                    "business_function": business_function,
                    "lead_id": result.get("lead_id"),
                    "inventory_id": result.get("inventory_id"),
                    "has_incomplete_info": has_incomplete_info
                }
            else:
                logger.warning(f"Failed to process salesperson business message: {result.get('error', 'Unknown error')}")
                return {
                    "success": False,
                    "error": result.get("error", "Processing failed"),
                    "message": result.get("message", "Sorry, there was an error processing your message. Please try again."),
                    "has_pending_approval": False
                }
                
        except Exception as e:
            logger.error(f"Error processing salesperson business message: {e}")
            return {
                "success": False,
                "error": "Business message processing error",
                "message": "Sorry, there was an error processing your business message. Please try again."
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
                    "• Reply 'EDIT [instructions]' to have me regenerate the response\n"
                    "• Reply 'FORCE [your message]' to send your custom message directly\n\n"
                    "Examples:\n"
                    "• EDIT Make it more friendly and mention financing\n"
                    "• FORCE Hi John! I'll call you in 5 minutes to discuss the Toyota Camry."
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
            
            # Create enhanced prompt that prioritizes the edit instructions
            # The edit should take priority over the original response content
            enhanced_prompt = f"""Customer inquiry: {pending_approval.customer_message}

IMPORTANT: The salesperson has requested specific edits to the response. 
These edits MUST be included and take priority over other content.

Salesperson edit requirements: {edit_instructions}

Please generate a response that:
1. Addresses the customer's inquiry
2. Incorporates ALL the requested edits as the primary focus
3. Ensures no conflicting information with the edit requirements
4. Maintains a professional and helpful tone

Generate a response that prioritizes the edit instructions:"""
            
            # Generate new response using RAG with edit-focused prompt
            vehicles = await enhanced_rag_service.search_vehicles_with_context(
                session=session,
                dealership_id=dealership_id,
                query=enhanced_prompt,
                conversations=all_conversations,
                top_k=3
            )
            
            # Generate enhanced AI response with edit instructions as priority
            enhanced_response = enhanced_rag_service.generate_enhanced_response(
                enhanced_prompt,
                vehicles,
                all_conversations,
                "Customer",  # Generic name for context
                None,  # dealership_name
                str(pending_approval.lead_id)  # lead_id
            )
            
            new_response_text = enhanced_response['response_text']
            
            # Validate that the edit requirements are actually included in the response
            edit_requirements_met = self._validate_edit_requirements(
                new_response_text, 
                edit_instructions
            )
            
            if not edit_requirements_met:
                # If edit requirements weren't met, try to regenerate with stronger emphasis
                logger.warning(f"Edit requirements not fully met, regenerating with stronger emphasis")
                stronger_prompt = f"""Customer inquiry: {pending_approval.customer_message}

CRITICAL: The salesperson has requested these specific edits that MUST be included:
"{edit_instructions}"

Generate a response that PRIORITIZES these edits above all else. 
The response should be built around these edit requirements, not just include them as an afterthought.

Focus on: {edit_instructions}"""
                
                # Regenerate with stronger emphasis
                vehicles_retry = await enhanced_rag_service.search_vehicles_with_context(
                    session=session,
                    dealership_id=dealership_id,
                    query=stronger_prompt,
                    conversations=all_conversations,
                    top_k=3
                )
                
                enhanced_response_retry = enhanced_rag_service.generate_enhanced_response(
                    stronger_prompt,
                    vehicles_retry,
                    all_conversations,
                    "Customer",
                    None,  # dealership_name
                    str(pending_approval.lead_id)  # lead_id
                )
                
                new_response_text = enhanced_response_retry['response_text']
                
                # Validate again
                edit_requirements_met = self._validate_edit_requirements(
                    new_response_text, 
                    edit_instructions
                )
                
                if not edit_requirements_met:
                    logger.warning(f"Edit requirements still not met after retry, proceeding with current response")
            
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
            
            # Send new response for approval with FORCE option included
            approval_message = (
                f"🔄 Response edited and regenerated!\n\n"
                f"Customer: {pending_approval.customer_message}\n\n"
                f"Edit instructions: {edit_instructions}\n\n"
                f"New suggested reply: {new_response_text}\n\n"
                f"📱 Reply with:\n"
                f"• 'YES' to send this response\n"
                f"• 'NO' to reject it\n"
                f"• 'EDIT [instructions]' to edit again\n"
                f"• 'FORCE [your message]' to send your custom message directly"
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
                    "new_response": new_response_text,
                    "edit_requirements_met": edit_requirements_met
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
    
    def _validate_edit_requirements(self, response_text: str, edit_instructions: str) -> bool:
        """Validate that the edit requirements are actually included in the response"""
        try:
            # Convert both to lowercase for comparison
            response_lower = response_text.lower()
            edit_lower = edit_instructions.lower()
            
            # Extract key phrases from edit instructions
            key_phrases = []
            
            # Look for common edit patterns
            if "friendly" in edit_lower or "more friendly" in edit_lower:
                key_phrases.extend(["friendly", "warm", "welcoming", "😊", "thanks", "excited"])
            
            if "financing" in edit_lower or "apr" in edit_lower or "payment" in edit_lower:
                key_phrases.extend(["financing", "apr", "payment", "0%", "promotion", "offer"])
            
            if "call" in edit_lower or "phone" in edit_lower:
                key_phrases.extend(["call", "phone", "contact", "reach out"])
            
            if "test drive" in edit_lower:
                key_phrases.extend(["test drive", "schedule", "appointment"])
            
            if "price" in edit_lower or "cost" in edit_lower:
                key_phrases.extend(["price", "cost", "value", "$"])
            
            # Check if key phrases are present in response
            phrases_found = sum(1 for phrase in key_phrases if phrase in response_lower)
            
            # If we have specific key phrases, check if at least 60% are found
            if key_phrases:
                return phrases_found >= len(key_phrases) * 0.6
            
            # If no specific key phrases, do a general content check
            # Look for common words that should be present based on edit context
            edit_words = [word for word in edit_lower.split() if len(word) > 3]
            response_words = response_lower.split()
            
            # Check if edit words appear in response
            matching_words = sum(1 for word in edit_words if word in response_words)
            
            return matching_words >= len(edit_words) * 0.5
            
        except Exception as e:
            logger.error(f"Error validating edit requirements: {e}")
            # If validation fails, assume requirements are met to avoid blocking the flow
            return True
    
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
                dealership_id=dealership_id,
                enhanced_rag_service=enhanced_rag_service
            )
            
            if not rag_response["success"]:
                return rag_response
            
            # Implement handoff routing
            should_handoff = rag_response.get("should_handoff", False)
            handoff_reason = rag_response.get("handoff_reason", "")
            handoff_reasoning = rag_response.get("handoff_reasoning", "")
            
            if should_handoff:
                # Handoff to salesperson
                logger.info(f"Handing off to salesperson for lead {lead.id}: reason='{handoff_reason}', reasoning='{handoff_reasoning}'")
                
                # Send handoff message
                handoff_message = "That's something my teammate can help with, let me connect you."
                direct_response_result = await self._send_direct_response(
                    session=session,
                    lead=lead,
                    response_text=handoff_message,
                    customer_phone=from_phone,
                    message_source=message_source
                )
                
                # Notify assigned salesperson about handoff
                if lead.assigned_user_id:
                    try:
                        await self._notify_assigned_salesperson_handoff(
                            session=session,
                            lead=lead,
                            customer_message=message_text,
                            handoff_reason=handoff_reason,
                            customer_phone=from_phone,
                            message_source=message_source
                        )
                    except Exception as e:
                        logger.warning(f"Failed to notify assigned salesperson about handoff: {e}")
                
                return direct_response_result
            else:
                # Auto-send regular responses
                logger.info(f"Auto-sending response for lead {lead.id}: no handoff triggers detected")
                
                direct_response_result = await self._send_direct_response(
                    session=session,
                    lead=lead,
                    response_text=rag_response["response_text"],
                    customer_phone=from_phone,
                    message_source=message_source
                )
                
                return direct_response_result
                
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
        dealership_id: str,
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
            vehicles = await enhanced_rag_service.search_vehicles_with_context(
                session=session,
                dealership_id=dealership_id,
                query=message_text,
                conversations=all_conversations,
                top_k=3
            )
            
            # Get actual dealership name
            dealership_query = text("SELECT name FROM dealerships WHERE id = :dealership_id")
            dealership_result = await session.execute(dealership_query, {"dealership_id": dealership_id})
            dealership = dealership_result.fetchone()
            dealership_name = dealership.name if dealership else "our dealership"
            
            # Generate enhanced AI response with actual dealership name
            enhanced_response = enhanced_rag_service.generate_enhanced_response(
                message_text,
                vehicles,
                all_conversations,
                lead.name,
                dealership_name,
                lead_id=str(lead.id)
            )
            
            # Extract handoff routing information
            should_handoff = enhanced_response.get('should_handoff', False)
            handoff_reason = enhanced_response.get('handoff_reason', '')
            handoff_reasoning = enhanced_response.get('handoff_reasoning', '')
            retrieval_score = enhanced_response.get('retrieval_score', 0.0)
            
            # Log handoff routing decision
            logger.info(f"Handoff routing for lead {lead.id}: handoff={should_handoff}, reason='{handoff_reason}', reasoning='{handoff_reasoning}', retrieval_score={retrieval_score:.2f}")
            
            return {
                "success": True,
                "response_text": enhanced_response['response_text'],
                "vehicles_found": len(vehicles),
                "should_handoff": should_handoff,
                "handoff_reason": handoff_reason,
                "handoff_reasoning": handoff_reasoning,
                "retrieval_score": retrieval_score
            }
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {e}")
            return {
                "success": False,
                "error": "RAG generation error",
                "message": "Sorry, there was an error generating a response. Please try again."
            }
    
    async def _notify_assigned_salesperson_auto_sent(
        self,
        session: AsyncSession,
        lead: Any,
        customer_message: str,
        generated_response: str,
        customer_phone: str,
        message_source: str,
        confidence_score: float,
        routing_reasoning: str
    ) -> None:
        """Notify assigned salesperson about auto-sent response"""
        try:
            # Get the assigned user's phone number
            assigned_user = await get_user_profile_by_user_id(
                session=session,
                user_id=str(lead.assigned_user_id)
            )
            
            if not assigned_user or not assigned_user.phone:
                logger.warning(f"Assigned user {lead.assigned_user_id} not found or has no phone number")
                return
            
            # Send notification message to salesperson
            notification_message = (
                f"📱 Customer interaction from {lead.name} ({customer_phone}):\n\n"
                f"Customer: {customer_message}\n\n"
                f"🤖 AI Response Auto-Sent: {generated_response}\n\n"
                f"📊 Confidence: {confidence_score:.1%} - {routing_reasoning}\n\n"
                f"💡 The customer received an automatic response. You can follow up if needed."
            )
            
            # Send notification to salesperson
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    assigned_user.phone,
                    notification_message
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    assigned_user.phone,
                    notification_message
                )
            
            if send_result["success"]:
                logger.info(f"Sent auto-sent notification to salesperson {assigned_user.phone}")
            else:
                logger.error(f"Failed to send auto-sent notification: {send_result['error']}")
                
        except Exception as e:
            logger.error(f"Error notifying assigned salesperson about auto-sent response: {e}")

    async def _create_pending_approval(
        self,
        session: AsyncSession,
        lead: Any,
        customer_message: str,
        generated_response: str,
        customer_phone: str,
        message_source: str,
        confidence_score: float,
        routing_reasoning: str,
        dealership_id: str
    ) -> Dict[str, Any]:
        """Create pending approval for human review"""
        try:
            # Get the assigned user for this lead
            assigned_user_id = lead.assigned_user_id
            
            if not assigned_user_id:
                # If no assigned user, we need to find one or assign one
                # For now, we'll create a generic approval that can be handled by any salesperson
                logger.warning(f"No assigned user for lead {lead.id}, creating generic approval")
                assigned_user_id = None
            
            # Create pending approval
            approval = await create_pending_approval(
                session=session,
                lead_id=str(lead.id),
                user_id=str(assigned_user_id) if assigned_user_id else str(lead.assigned_user_id) if lead.assigned_user_id else "00000000-0000-0000-0000-000000000000",  # Fallback UUID
                customer_message=customer_message,
                generated_response=generated_response,
                customer_phone=customer_phone,
                dealership_id=dealership_id
            )
            
            # Send notification to assigned salesperson if available
            if assigned_user_id:
                try:
                    await self._notify_assigned_salesperson_draft(
                        session=session,
                        lead=lead,
                        customer_message=customer_message,
                        generated_response=generated_response,
                        customer_phone=customer_phone,
                        message_source=message_source,
                        confidence_score=confidence_score,
                        routing_reasoning=routing_reasoning
                    )
                except Exception as e:
                    logger.warning(f"Failed to notify assigned salesperson about draft: {e}")
            
            return {
                "success": True,
                "message": "Response drafted for human review",
                "approval_id": str(approval.id),
                "confidence_score": confidence_score,
                "routing_reasoning": routing_reasoning,
                "needs_approval": True
            }
            
        except Exception as e:
            logger.error(f"Error creating pending approval: {e}")
            return {
                "success": False,
                "error": "Failed to create approval",
                "message": "Sorry, there was an error processing your message. Please try again."
            }

    async def _notify_assigned_salesperson_draft(
        self,
        session: AsyncSession,
        lead: Any,
        customer_message: str,
        generated_response: str,
        customer_phone: str,
        message_source: str,
        confidence_score: float,
        routing_reasoning: str
    ) -> None:
        """Notify assigned salesperson about drafted response"""
        try:
            # Get the assigned user's phone number
            assigned_user = await get_user_profile_by_user_id(
                session=session,
                user_id=str(lead.assigned_user_id)
            )
            
            if not assigned_user or not assigned_user.phone:
                logger.warning(f"Assigned user {lead.assigned_user_id} not found or has no phone number")
                return
            
            # Send notification message to salesperson
            notification_message = (
                f"📱 Customer message from {lead.name} ({customer_phone}):\n\n"
                f"Customer: {customer_message}\n\n"
                f"🤖 Drafted Response: {generated_response}\n\n"
                f"📊 Confidence: {confidence_score:.1%} - {routing_reasoning}\n\n"
                f"⚠️ This response needs your approval before sending to the customer.\n"
                f"Reply YES to send, NO to reject, or EDIT to modify."
            )
            
            # Send notification to salesperson
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    assigned_user.phone,
                    notification_message
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    assigned_user.phone,
                    notification_message
                )
            
            if send_result["success"]:
                logger.info(f"Sent draft notification to salesperson {assigned_user.phone}")
            else:
                logger.error(f"Failed to send draft notification: {send_result['error']}")
                
        except Exception as e:
            logger.error(f"Error notifying assigned salesperson about draft: {e}")

    async def _notify_assigned_salesperson_handoff(
        self,
        session: AsyncSession,
        lead: Any,
        customer_message: str,
        handoff_reason: str,
        customer_phone: str,
        message_source: str
    ) -> None:
        """Notify assigned salesperson about handoff"""
        try:
            # Get the assigned user's phone number
            assigned_user = await get_user_profile_by_user_id(
                session=session,
                user_id=str(lead.assigned_user_id)
            )
            
            if not assigned_user or not assigned_user.phone:
                logger.warning(f"Assigned user {lead.assigned_user_id} not found or has no phone number")
                return
            
            # Send notification about handoff
            notification_message = f"Customer handoff needed for lead {lead.id}. Reason: {handoff_reason}. Customer message: {customer_message}"
            
            await self.sms_service.send_sms(
                to_phone=assigned_user.phone,
                message=notification_message
            )
            
            logger.info(f"Notified salesperson {assigned_user.phone} about handoff for lead {lead.id}")
            
        except Exception as e:
            logger.error(f"Error notifying assigned salesperson about handoff: {e}")
            raise

    async def _notify_assigned_salesperson(
        self,
        session: AsyncSession,
        lead: Any,
        customer_message: str,
        generated_response: str,
        customer_phone: str,
        message_source: str
    ) -> None:
        """Notify assigned salesperson about customer interaction (no approval required)"""
        try:
            # Get the assigned user's phone number
            assigned_user = await get_user_profile_by_user_id(
                session=session,
                user_id=str(lead.assigned_user_id)
            )
            
            if not assigned_user or not assigned_user.phone:
                logger.warning(f"Assigned user {lead.assigned_user_id} not found or has no phone number")
                return
            
            # Send notification message to salesperson
            notification_message = (
                f"📱 Customer interaction from {lead.name} ({customer_phone}):\n\n"
                f"Customer: {customer_message}\n\n"
                f"🤖 AI Response Sent: {generated_response}\n\n"
                f"💡 The customer received an automatic response. You can follow up if needed."
            )
            
            # Send notification to salesperson
            if message_source == "whatsapp":
                from ..services.whatsapp_service import whatsapp_service
                send_result = await whatsapp_service.send_message(
                    assigned_user.phone,
                    notification_message
                )
            else:
                from ..services.sms_service import sms_service
                send_result = await sms_service.send_sms(
                    assigned_user.phone,
                    notification_message
                )
            
            if send_result["success"]:
                logger.info(f"Notified assigned salesperson {lead.assigned_user_id} about customer interaction")
            else:
                logger.warning(f"Failed to notify salesperson: {send_result['error']}")
                
        except Exception as e:
            logger.error(f"Error notifying assigned salesperson: {e}")

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
                user_id=str(lead.assigned_user_id)
            )
            
            if not assigned_user or not assigned_user.phone:
                logger.warning(f"Assigned user {lead.assigned_user_id} not found or has no phone number")
                return {
                    "success": False,
                    "error": "Assigned user not found",
                    "message": "Lead has assigned user but no phone number found for approval."
                }
            
            # Create pending approval
            pending_approval = await create_pending_approval(
                session=session,
                lead_id=str(lead.id),
                assigned_user_id=str(lead.assigned_user_id),
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
                f"• 'FORCE [your message]' to send your own message directly"
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
                logger.info(f"Created pending approval {pending_approval.id} and sent to user {lead.assigned_user_id}")
                
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
