"""
Confidence routing service for determining when to auto-send vs draft responses.
"""

import re
from typing import Dict, Any, List, Tuple
from loguru import logger


class ConfidenceRouter:
    """Service for determining confidence levels and routing decisions."""
    
    def __init__(self):
        """Initialize confidence router with thresholds and patterns."""
        # Confidence thresholds
        self.auto_send_threshold = 0.8
        self.draft_threshold = 0.6
        
        # Safe topics that can be auto-sent with high confidence
        self.safe_topics = [
            'availability', 'inventory', 'stock', 'have', 'available',
            'mileage', 'year', 'make', 'model', 'color', 'features',
            'condition', 'history', 'maintenance'
        ]
        
        # Topics that should always be drafted for human review
        self.draft_topics = [
            'financing', 'finance', 'loan', 'credit', 'payment', 'monthly',
            'trade', 'trade-in', 'trade in', 'appraisal', 'value',
            'price', 'cost', 'deal', 'discount', 'negotiate', 'best price',
            'warranty', 'insurance', 'legal', 'contract', 'terms',
            'delivery', 'shipping', 'pickup', 'title', 'registration'
        ]
        
        # Low confidence indicators
        self.low_confidence_indicators = [
            'maybe', 'think', 'consider', 'not sure', 'unsure',
            'between', 'either', 'or', 'help', 'advice', 'recommend',
            'which', 'what', 'how', 'why', 'when', 'where'
        ]
    
    def calculate_confidence(
        self, 
        query: str, 
        vehicles: List[Dict[str, Any]], 
        response_text: str,
        retrieval_score: float
    ) -> Tuple[float, str, bool]:
        """
        Calculate confidence score and determine routing decision.
        
        Args:
            query: Original customer query
            vehicles: Retrieved vehicles
            response_text: Generated response text
            retrieval_score: Similarity score from retrieval
            
        Returns:
            Tuple of (confidence_score, reasoning, should_auto_send)
        """
        try:
            # Start with retrieval score as base
            confidence = retrieval_score
            
            # Analyze query content
            query_analysis = self._analyze_query(query)
            confidence += query_analysis['confidence_adjustment']
            
            # Analyze response quality
            response_analysis = self._analyze_response(response_text, vehicles)
            confidence += response_analysis['confidence_adjustment']
            
            # Analyze topic safety
            topic_analysis = self._analyze_topic_safety(query, response_text)
            confidence += topic_analysis['confidence_adjustment']
            
            # Ensure confidence is between 0 and 1
            confidence = max(0.0, min(1.0, confidence))
            
            # Determine if should auto-send
            should_auto_send = self._should_auto_send(confidence, query, response_text)
            
            # Generate reasoning
            reasoning = self._generate_reasoning(
                confidence, query_analysis, response_analysis, 
                topic_analysis, should_auto_send
            )
            
            logger.info(f"Confidence routing: {confidence:.2f}, auto_send: {should_auto_send}, reasoning: {reasoning}")
            
            return confidence, reasoning, should_auto_send
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            # Default to draft for safety
            return 0.5, f"Error in confidence calculation: {e}", False
    
    def _analyze_query(self, query: str) -> Dict[str, Any]:
        """Analyze query characteristics for confidence scoring."""
        query_lower = query.lower()
        
        # Check for specific vehicle requests (high confidence)
        specific_vehicle_patterns = [
            r'\d{4}\s+\w+\s+\w+',  # "2021 Honda Civic"
            r'\w+\s+\w+\s+\w+',     # "Honda Civic SE"
            r'vin\s+\w+',           # "VIN 123456"
        ]
        
        is_specific = any(re.search(pattern, query_lower) for pattern in specific_vehicle_patterns)
        
        # Check for availability questions (high confidence)
        availability_questions = [
            'do you have', 'is available', 'still available', 'in stock',
            'have any', 'got any', 'carry', 'sell'
        ]
        
        is_availability = any(phrase in query_lower for phrase in availability_questions)
        
        # Check for ambiguous questions (low confidence)
        ambiguous_indicators = [
            'best', 'good', 'reliable', 'recommend', 'suggest',
            'between', 'either', 'or', 'help me choose'
        ]
        
        is_ambiguous = any(indicator in query_lower for indicator in ambiguous_indicators)
        
        # Calculate confidence adjustment
        confidence_adjustment = 0.0
        if is_specific and is_availability:
            confidence_adjustment += 0.2
        elif is_specific:
            confidence_adjustment += 0.1
        elif is_ambiguous:
            confidence_adjustment -= 0.2
        
        return {
            'is_specific': is_specific,
            'is_availability': is_availability,
            'is_ambiguous': is_ambiguous,
            'confidence_adjustment': confidence_adjustment
        }
    
    def _analyze_response(self, response_text: str, vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze response quality for confidence scoring."""
        response_lower = response_text.lower()
        
        # Check if response contains specific vehicle details
        has_specific_details = any(
            detail in response_lower for detail in [
                'miles', 'mileage', 'year', 'price', '$', 'condition',
                'features', 'color', 'trim'
            ]
        )
        
        # Check if response has vehicles to reference
        has_vehicles = len(vehicles) > 0
        
        # Check for uncertainty indicators in response
        uncertainty_indicators = [
            'i think', 'maybe', 'possibly', 'might', 'could be',
            'let me check', 'double-check', 'not sure'
        ]
        
        has_uncertainty = any(indicator in response_lower for indicator in uncertainty_indicators)
        
        # Calculate confidence adjustment
        confidence_adjustment = 0.0
        if has_specific_details and has_vehicles:
            confidence_adjustment += 0.15
        elif has_vehicles:
            confidence_adjustment += 0.1
        elif has_uncertainty:
            confidence_adjustment -= 0.2
        
        return {
            'has_specific_details': has_specific_details,
            'has_vehicles': has_vehicles,
            'has_uncertainty': has_uncertainty,
            'confidence_adjustment': confidence_adjustment
        }
    
    def _analyze_topic_safety(self, query: str, response_text: str) -> Dict[str, Any]:
        """Analyze topic safety for confidence scoring."""
        query_lower = query.lower()
        response_lower = response_text.lower()
        
        # Check for safe topics
        has_safe_topics = any(topic in query_lower for topic in self.safe_topics)
        
        # Check for draft topics
        has_draft_topics = any(topic in query_lower for topic in self.draft_topics)
        
        # Check for low confidence indicators
        has_low_confidence = any(indicator in query_lower for indicator in self.low_confidence_indicators)
        
        # Calculate confidence adjustment
        confidence_adjustment = 0.0
        if has_safe_topics and not has_draft_topics:
            confidence_adjustment += 0.1
        elif has_draft_topics:
            confidence_adjustment -= 0.3
        elif has_low_confidence:
            confidence_adjustment -= 0.2
        
        return {
            'has_safe_topics': has_safe_topics,
            'has_draft_topics': has_draft_topics,
            'has_low_confidence': has_low_confidence,
            'confidence_adjustment': confidence_adjustment
        }
    
    def _should_auto_send(self, confidence: float, query: str, response_text: str) -> bool:
        """Determine if response should be auto-sent based on confidence and content."""
        query_lower = query.lower()
        
        # Always draft if confidence is below threshold
        if confidence < self.auto_send_threshold:
            return False
        
        # Always draft if query contains draft topics
        if any(topic in query_lower for topic in self.draft_topics):
            return False
        
        # Always draft if response contains uncertainty
        uncertainty_indicators = [
            'let me check', 'double-check', 'not sure', 'i think',
            'maybe', 'possibly', 'might', 'could be'
        ]
        
        if any(indicator in response_text.lower() for indicator in uncertainty_indicators):
            return False
        
        # Auto-send if high confidence and safe topics
        return confidence >= self.auto_send_threshold
    
    def _generate_reasoning(
        self, 
        confidence: float, 
        query_analysis: Dict[str, Any], 
        response_analysis: Dict[str, Any],
        topic_analysis: Dict[str, Any], 
        should_auto_send: bool
    ) -> str:
        """Generate human-readable reasoning for the routing decision."""
        reasons = []
        
        if query_analysis['is_specific'] and query_analysis['is_availability']:
            reasons.append("specific availability question")
        elif query_analysis['is_specific']:
            reasons.append("specific vehicle request")
        elif query_analysis['is_ambiguous']:
            reasons.append("ambiguous question")
        
        if response_analysis['has_specific_details'] and response_analysis['has_vehicles']:
            reasons.append("response has specific vehicle details")
        elif response_analysis['has_uncertainty']:
            reasons.append("response contains uncertainty")
        
        if topic_analysis['has_safe_topics'] and not topic_analysis['has_draft_topics']:
            reasons.append("safe topic")
        elif topic_analysis['has_draft_topics']:
            reasons.append("requires human review (financing/pricing)")
        elif topic_analysis['has_low_confidence']:
            reasons.append("low confidence indicators")
        
        if should_auto_send:
            return f"Auto-send: {confidence:.2f} confidence, {', '.join(reasons)}"
        else:
            return f"Draft: {confidence:.2f} confidence, {', '.join(reasons)}"
    
    def get_routing_stats(self) -> Dict[str, Any]:
        """Get statistics about routing decisions."""
        return {
            'auto_send_threshold': self.auto_send_threshold,
            'draft_threshold': self.draft_threshold,
            'safe_topics_count': len(self.safe_topics),
            'draft_topics_count': len(self.draft_topics),
            'low_confidence_indicators_count': len(self.low_confidence_indicators)
        }
