"""
Handoff router for Maqro RAG system.

This module provides trigger-based handoff routing that determines when to
transfer conversations from the AI agent to human salespeople based on
specific keywords and phrases in customer messages.
"""
from typing import Dict, Any, Tuple, List
import logging

logger = logging.getLogger(__name__)


class HandoffRouter:
    """
    Router that determines when to handoff to salesperson based on triggers.
    
    This replaces complex confidence scoring with simple, reliable trigger-based
    routing that can be easily configured and monitored.
    """
    
    def __init__(self):
        """Initialize handoff router with trigger patterns."""
        self.handoff_triggers = self._initialize_trigger_patterns()
        self.handoff_messages = self._initialize_handoff_messages()
    
    def _initialize_trigger_patterns(self) -> Dict[str, List[str]]:
        """Initialize trigger patterns for different handoff reasons."""
        return {
            'financing': [
                'financing', 'finance', 'loan', 'credit', 'apr', 'interest rate',
                'monthly payment', 'payment plan', 'lease', 'lease options',
                'credit score', 'bad credit', 'no credit', 'down payment',
                'qualify', 'pre-approval', 'approval'
            ],
            'trade_in': [
                'trade', 'trade-in', 'trade in', 'appraisal', 'my car', 'current car',
                'what\'s my car worth', 'trade value', 'trade allowance',
                'trade my car', 'value my car', 'car worth'
            ],
            'pricing': [
                'out the door', 'out the door price', 'total cost', 'final price',
                'best price', 'lowest price', 'negotiate', 'deal', 'discount',
                'what can you do', 'flexible on price', 'make an offer',
                'counter offer', 'haggle', 'bargain'
            ],
            'appointment_scheduled': [
                'test drive scheduled', 'appointment booked', 'coming in',
                'see you at', 'meeting with', 'scheduled for', 'booked for',
                'appointment set', 'test drive booked'
            ],
            'test_drive_scheduling': [
                # Only trigger after time is confirmed, not on initial request
                'test drive scheduled', 'appointment booked', 'coming in',
                'see you at', 'meeting with', 'scheduled for', 'booked for',
                'appointment set', 'test drive booked'
            ],
            'test_drive_time_confirmed': [
                '2pm', '3pm', '4pm', '10am', '11am', 'morning', 'afternoon', 'evening',
                '9am', '1pm', '5pm', '6pm', '7pm', '8am', '12pm', 'noon'
            ],
            'legal_compliance': [
                'warranty', 'insurance', 'legal', 'contract', 'terms',
                'disclaimer', 'liability', 'guarantee', 'return policy'
            ],
            'media_requests': [
                'photos', 'pictures', 'images', 'video', 'videos', 'send me photos',
                'can you send', 'do you have photos', 'show me pictures'
            ],
            'uncertainty': [
                'not sure', 'unsure', 'maybe', 'possibly', 'might', 'could be',
                'i think', 'i believe', 'probably', 'likely'
            ],
            'out_of_scope': [
                'motorcycle', 'motorcycles', 'bike', 'bikes', 'service', 
                'maintenance', 'repair', 'parts', 'accessories'
            ]
        }
    
    def _initialize_handoff_messages(self) -> Dict[str, str]:
        """Initialize handoff messages for different reasons."""
        return {
            'financing': "That's something someone on my team can walk you through. I'll have them follow up with you directly right away.",
            'trade_in': "That's something my teammate can help with, let me connect you.",
            'pricing': "That's something my teammate can help with, let me connect you.",
            'appointment_scheduled': "Perfect! I'll connect you with a salesperson who can help with the details.",
            'test_drive_scheduling': "Perfect! I'll see you then! Looking forward to your test drive.",
            'test_drive_time_confirmed': "Perfect! I'll see you then! Looking forward to your test drive.",
            'legal_compliance': "That's something my teammate can help with, let me connect you.",
            'media_requests': "I'll have someone send photos shortly. Would you like me to text them to this number?",
            'uncertainty': "That's something my teammate can help with, let me connect you.",
            'out_of_scope': "That's something my teammate can help with, let me connect you."
        }
    
    def should_handoff(self, query: str, response_text: str = "", has_appointment: bool = False) -> Tuple[bool, str, str]:
        """
        Determine if conversation should be handed off to salesperson.
        
        Args:
            query: Customer's message
            response_text: Generated response (for appointment detection)
            has_appointment: Whether an appointment is already scheduled
            
        Returns:
            Tuple of (should_handoff, handoff_reason, reasoning)
        """
        query_lower = query.lower()
        response_lower = response_text.lower()
        
        # If appointment is already scheduled, only handoff for new requests, not follow-ups
        if has_appointment:
            # Only handoff for new test drive requests, not questions about existing appointment
            if any(phrase in query_lower for phrase in ['book another', 'schedule another', 'new test drive']):
                return True, 'test_drive_scheduling', "New test drive request after existing appointment"
            
            # For questions about existing appointment, don't handoff
            if any(phrase in query_lower for phrase in ['what time', 'when is', 'my appointment', 'test drive time']):
                return False, "", "Question about existing appointment - no handoff needed"
        
        # Check for time confirmation first (highest priority)
        time_confirmation_result = self._check_time_confirmation(query_lower)
        if time_confirmation_result[0]:
            return time_confirmation_result
        
        # Check for other handoff triggers
        trigger_result = self._check_handoff_triggers(query_lower)
        if trigger_result[0]:
            return trigger_result
        
        # Check for appointment scheduling in response
        appointment_result = self._check_appointment_scheduling(response_lower)
        if appointment_result[0]:
            return appointment_result
        
        # No handoff needed
        return False, "", "No handoff triggers detected"
    
    def _check_time_confirmation(self, query_lower: str) -> Tuple[bool, str, str]:
        """Check for test drive time confirmation triggers."""
        time_triggers = self.handoff_triggers.get('test_drive_time_confirmed', [])
        for trigger in time_triggers:
            if trigger in query_lower:
                return True, 'test_drive_time_confirmed', f"Customer provided time: '{trigger}'"
        return False, "", ""
    
    def _check_handoff_triggers(self, query_lower: str) -> Tuple[bool, str, str]:
        """Check for general handoff triggers."""
        for reason, triggers in self.handoff_triggers.items():
            if reason == 'test_drive_time_confirmed':
                continue  # Already checked above
            for trigger in triggers:
                if trigger in query_lower:
                    return True, reason, f"Customer asked about {reason}: '{trigger}'"
        return False, "", ""
    
    def _check_appointment_scheduling(self, response_lower: str) -> Tuple[bool, str, str]:
        """Check if appointment was scheduled in the response."""
        appointment_phrases = [
            'test drive scheduled', 
            'appointment booked', 
            'see you at'
        ]
        
        for phrase in appointment_phrases:
            if phrase in response_lower:
                return True, 'appointment_scheduled', "Test drive or appointment was scheduled"
        
        return False, "", ""
    
    def get_handoff_message(self, handoff_reason: str) -> str:
        """
        Get appropriate handoff message based on reason.
        
        Args:
            handoff_reason: The reason for handoff
            
        Returns:
            Appropriate handoff message
        """
        return self.handoff_messages.get(
            handoff_reason, 
            "That's something my teammate can help with, let me connect you."
        )
    
    def get_routing_stats(self) -> Dict[str, Any]:
        """
        Get routing statistics for monitoring.
        
        Returns:
            Dictionary with routing statistics
        """
        return {
            "handoff_triggers_configured": len(self.handoff_triggers),
            "total_trigger_patterns": sum(len(triggers) for triggers in self.handoff_triggers.values()),
            "trigger_categories": list(self.handoff_triggers.keys())
        }
    
    def add_trigger(self, category: str, trigger: str) -> None:
        """
        Add a new trigger to a category.
        
        Args:
            category: The trigger category
            trigger: The trigger phrase to add
        """
        if category not in self.handoff_triggers:
            self.handoff_triggers[category] = []
        
        if trigger not in self.handoff_triggers[category]:
            self.handoff_triggers[category].append(trigger)
            logger.info(f"Added trigger '{trigger}' to category '{category}'")
    
    def remove_trigger(self, category: str, trigger: str) -> bool:
        """
        Remove a trigger from a category.
        
        Args:
            category: The trigger category
            trigger: The trigger phrase to remove
            
        Returns:
            True if trigger was removed, False if not found
        """
        if category in self.handoff_triggers and trigger in self.handoff_triggers[category]:
            self.handoff_triggers[category].remove(trigger)
            logger.info(f"Removed trigger '{trigger}' from category '{category}'")
            return True
        return False