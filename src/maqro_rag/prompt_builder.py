"""
Centralized prompt builder for conversational RAG responses.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from loguru import logger


@dataclass
class AgentConfig:
    """Configuration for agent persona and tone."""
    tone: str = "friendly"  # friendly, professional, concise
    dealership_name: str = "our dealership"
    persona_blurb: str = "friendly, persuasive car salesperson"
    signature: Optional[str] = None
    
    @classmethod
    def from_dict(cls, config: Dict[str, Any]) -> "AgentConfig":
        """Create AgentConfig from dictionary."""
        return cls(
            tone=config.get("tone", "friendly"),
            dealership_name=config.get("dealership_name", "our dealership"),
            persona_blurb=config.get("persona_blurb", "friendly, persuasive car salesperson"),
            signature=config.get("signature")
        )


class PromptBuilder:
    """Builder for conversational prompts with SMS-style responses."""
    
    def __init__(self, agent_config: AgentConfig):
        """Initialize prompt builder with agent configuration."""
        self.agent_config = agent_config
        self.few_shot_examples = self._get_few_shot_examples()
    
    def build_grounded_prompt(
        self, 
        user_message: str, 
        retrieved_cars: List[Dict[str, Any]], 
        agent_config: Optional[AgentConfig] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Build prompt for responses with retrieved vehicle data."""
        if agent_config is None:
            agent_config = self.agent_config
        
        # Format retrieved cars
        cars_text = self._format_cars_for_prompt(retrieved_cars)
        
        # Build system prompt
        system_prompt = self._build_system_prompt(agent_config)
        
        # Build few-shot examples
        examples = self._get_relevant_examples("grounded")
        
        # Build conversation context (if provided)
        conversation_context = ""
        if conversation_history:
            conversation_context = self._format_conversation_context(conversation_history)
        
        # Add conversation flow guidance
        flow_guidance = self._get_conversation_flow_guidance(conversation_history, user_message)
        
        # Build user prompt
        user_prompt = f"""Customer message: "{user_message}"

Available vehicles:
{cars_text}

{flow_guidance}

Please respond in a conversational, SMS-style manner. Keep it to 2-4 short sentences with one clear next step or question."""

        # Combine all parts
        full_prompt = f"{system_prompt}\n\n{examples}"
        if conversation_context:
            full_prompt += f"\n\n{conversation_context}"
        full_prompt += f"\n\n{user_prompt}"

        return full_prompt
    
    def build_generic_prompt(
        self, 
        user_message: str, 
        agent_config: Optional[AgentConfig] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Build prompt for responses without specific vehicle data."""
        if agent_config is None:
            agent_config = self.agent_config
        
        # Build system prompt
        system_prompt = self._build_system_prompt(agent_config)
        
        # Build few-shot examples
        examples = self._get_relevant_examples("generic")
        
        # Build conversation context (if provided)
        conversation_context = ""
        if conversation_history:
            conversation_context = self._format_conversation_context(conversation_history)
        
        # Add conversation flow guidance
        flow_guidance = self._get_conversation_flow_guidance(conversation_history, user_message)
        
        # Build user prompt
        user_prompt = f"""Customer message: "{user_message}"

No specific vehicles found in inventory. 

{flow_guidance}

Please respond helpfully and ask a clarifying question to better understand their needs."""

        # Combine all parts
        full_prompt = f"{system_prompt}\n\n{examples}"
        if conversation_context:
            full_prompt += f"\n\n{conversation_context}"
        full_prompt += f"\n\n{user_prompt}"

        return full_prompt
    
    def _build_system_prompt(self, agent_config: AgentConfig) -> str:
        """Build the system prompt with agent configuration."""
        system_prompt = f"""ROLE
You are a warm, genuine car salesperson at {agent_config.dealership_name}. You text like a real human - conversational, empathetic, and focused on helping customers find their perfect car. Your goal is to build trust and get them into the dealership for a test drive.

PERSONALITY & RAPPORT BUILDING
- Be genuinely helpful and empathetic - understand their needs, not just sell
- Use their name naturally when you know it
- Show enthusiasm about cars that match their needs
- Be honest about what you have and don't have
- Use casual, friendly language with contractions (I'm, you're, we've, etc.)
- Share relatable details: "This one's been really popular with families like yours"
- Acknowledge their concerns: "I totally get wanting something reliable"
- NO emojis, em dashes, or special characters. Keep responses completely natural and clean.

CONVERSATION FLOW STRATEGY
Your ultimate goal: Get them into the dealership for a test drive, then guide toward negotiation and signing.

Phase 1 - BUILD RAPPORT & UNDERSTAND NEEDS:
- Listen actively to what they're saying
- Ask follow-up questions that show you care about their situation
- Share relevant personal touches: "I've got a similar car and love it for..."
- Build excitement about the right vehicle for them

Phase 2 - CREATE URGENCY & DESIRE:
- Highlight what makes specific cars special for their needs
- Create urgency naturally: "This one just came in and won't last long"
- Make them visualize owning it: "You'd love how this handles on your commute"

Phase 3 - REMOVE BARRIERS TO TEST DRIVE:
- Address concerns proactively: "No pressure, just a quick 15-minute spin"
- Make it super easy: "I can have it ready in 10 minutes"
- Offer flexible timing: "What works better for you - today or tomorrow?"

STYLE GUIDELINES
- SMS tone: 2-4 short sentences max. No bullet points or lists.
- Be specific about vehicle details (year, trim, price, mileage, color)
- Use natural conversation flow - respond to what they said before moving forward
- Ask ONE question at a time and wait for their response
- NO emojis, em dashes, or special characters - keep it completely natural

DECISION POLICY (WHEN TO USE A CTA)
1) Customer is ending conversation (thanks, goodbye, have a great day, etc.):
   - Acknowledge warmly and end conversation naturally
   - NO sales push or offers
   - Use next_action: "end_conversation"

2) Customer shows interest (looking for, interested in, want, need, etc.):
   - Build excitement about matching vehicles
   - Offer test drive with specific time slots
   - Make it feel like an opportunity, not a sales pitch

3) Customer answers a question (budget, preferences, timing):
   - Respond enthusiastically to their answer
   - Offer relevant vehicles immediately
   - Don't ask another question - present solutions

4) Customer asks specific questions (features, availability, price):
   - Answer thoroughly and offer test drive
   - Create urgency: "Want to see it in person today?"

5) Customer hesitates ("not now", "maybe later"):
   - Acknowledge their timeline
   - Offer low-pressure option: "No worries! Want me to text you when we get something similar?"

6) No suitable inventory:
   - Be honest and helpful
   - Offer closest alternatives or ask ONE clarifying question

TEST DRIVE OFFERS (BE CONVERSATIONAL)
- Make it feel natural: "Want to take it for a quick spin?"
- Be specific about timing: "I'm free today at 3 or tomorrow morning"
- Remove pressure: "No commitment, just see how you like it"
- Include location naturally: "I'm here at {agent_config.dealership_name}"

SAFETY / HONESTY
- Never invent specifics. If unsure, say "Let me double-check that for you"
- Only reference vehicles you actually have in inventory
- Be transparent about pricing and condition

OUTPUT SHAPE
- Natural, conversational text reply (2–4 sentences), followed by a compact control object on the final line:
  JSON: {{"next_action":"<ask_clarify|offer_test_drive|confirm_test_drive|end_conversation>",
         "proposed_slots":["ISO1","ISO2"],
         "location_label":"{agent_config.dealership_name}",
         "confidence": 0.0-1.0}}
- Use ask_clarify for ONE question, then wait for response"""
        
        return system_prompt
    
    def _format_cars_for_prompt(self, cars: List[Dict[str, Any]]) -> str:
        """Format retrieved cars for prompt inclusion."""
        if not cars:
            return "No specific vehicles found."
        
        formatted_cars = []
        for i, car in enumerate(cars[:3], 1):  # Limit to top 3
            vehicle = car.get('vehicle', {})
            score = car.get('similarity_score', 0)
            
            year = vehicle.get('year', '')
            make = vehicle.get('make', '')
            model = vehicle.get('model', '')
            price = vehicle.get('price', 0)
            mileage = vehicle.get('mileage', 0)
            color = vehicle.get('color', '')
            features = vehicle.get('features', '')
            
            price_str = f"${price:,}" if price else "Price available upon request"
            mileage_str = f"{mileage:,} miles" if mileage else "Mileage available upon request"
            
            car_text = f"{i}. {year} {make} {model}"
            if color:
                car_text += f" in {color}"
            car_text += f" - {price_str}, {mileage_str}"
            
            if features:
                car_text += f" (Features: {features})"
            
            car_text += f" [Match: {score:.1%}]"
            formatted_cars.append(car_text)
        
        return "\n".join(formatted_cars)
    
    def _format_conversation_context(self, conversations: List[Dict[str, Any]], max_messages: int = 8) -> str:
        """Format conversation history with smart truncation to keep costs low."""
        if not conversations:
            return ""
        
        # Take only the most recent messages to keep context manageable
        recent_conversations = conversations[-max_messages:] if len(conversations) > max_messages else conversations
        
        context_parts = ["--- CONVERSATION HISTORY ---"]
        
        for conv in recent_conversations:
            role = "Customer" if conv.get("sender") == "customer" else "Agent"
            message = conv.get("message", "")
            
            # Truncate very long messages to keep costs down
            if len(message) > 200:
                message = message[:200] + "..."
            
            context_parts.append(f"{role}: {message}")
        
        # Add indicator if we truncated
        if len(conversations) > max_messages:
            context_parts.append(f"\n[Previous {len(conversations) - max_messages} messages omitted for brevity]")
        
        return "\n".join(context_parts)
    
    def _get_conversation_flow_guidance(self, conversation_history: List[Dict[str, Any]], user_message: str) -> str:
        """Get conversation flow guidance based on conversation stage and customer intent."""
        if not conversation_history:
            return "CONVERSATION STAGE: First contact - Focus on building rapport and understanding their needs."
        
        # Analyze conversation length and content
        conversation_length = len(conversation_history)
        user_message_lower = user_message.lower()
        
        # Check for specific intents in the message
        if any(word in user_message_lower for word in ['test drive', 'drive', 'test']):
            return "CONVERSATION STAGE: Test drive interest - Focus on scheduling and removing barriers. Make it easy and low-pressure."
        
        if any(word in user_message_lower for word in ['price', 'cost', 'payment', 'finance', 'monthly']):
            return "CONVERSATION STAGE: Pricing discussion - Be transparent about pricing and offer to discuss financing options."
        
        if any(word in user_message_lower for word in ['buy', 'purchase', 'deal', 'offer']):
            return "CONVERSATION STAGE: Purchase intent - Focus on closing the deal and getting them into the dealership."
        
        if any(word in user_message_lower for word in ['maybe', 'think', 'consider', 'not sure']):
            return "CONVERSATION STAGE: Hesitation - Address concerns and offer low-pressure options like test drive."
        
        if any(word in user_message_lower for word in ['thanks', 'thank you', 'goodbye', 'bye']):
            return "CONVERSATION STAGE: Ending - Acknowledge warmly and end conversation naturally."
        
        # Stage-based guidance
        if conversation_length <= 2:
            return "CONVERSATION STAGE: Early rapport building - Focus on understanding their needs and building excitement about matching vehicles."
        elif conversation_length <= 5:
            return "CONVERSATION STAGE: Interest development - Present specific vehicles and start guiding toward test drive."
        elif conversation_length <= 8:
            return "CONVERSATION STAGE: Decision making - Focus on removing barriers and making test drive easy."
        else:
            return "CONVERSATION STAGE: Closing - Be more direct about next steps and getting them into the dealership."
    
    def _get_few_shot_examples(self) -> Dict[str, List[Dict[str, str]]]:
        """Get few-shot examples for different scenarios."""
        return {
            "grounded": [
                {
                    "input": "Is the 2022 Tiguan SE in white still available?",
                    "output": "Yes! That white Tiguan SE is still here and it's gorgeous, only 28k miles and super clean. I've had a few families test drive it this week and they loved it. Want to come take a look today around 3 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T15:00:00-07:00\",\"2025-08-13T10:00:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.9}"
                },
                {
                    "input": "Looking for an SUV",
                    "output": "Awesome! SUVs are so popular right now. Are you thinking more for family use or something sporty?\n{\"next_action\":\"ask_clarify\",\"confidence\":0.8}"
                },
                {
                    "input": "What's your best deal on a sedan?",
                    "output": "I've got some really solid deals! There's a 2021 Honda Civic EX in blue for $19,800, only 35k miles and it's been super reliable. Also have a 2022 Camry SE for $24,500 that's practically new. Both are great values. Want to see either one today?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T15:00:00-07:00\",\"2025-08-13T10:00:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.88}"
                },
                {
                    "input": "Thanks, have a great day",
                    "output": "You too! Thanks for reaching out. Feel free to text me anytime if you have questions.\n{\"next_action\":\"end_conversation\",\"confidence\":0.95}"
                }
            ],
            "generic": [
                {
                    "input": "Any 3-row SUV under 30k?",
                    "output": "Perfect timing! I've got a 2021 Honda Pilot EX-L for $28,500 and a 2020 Toyota Highlander for $29,200. Both have third rows and are in excellent shape. The Pilot especially has been really popular with families. Want to come check them out today around 4 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T16:00:00-07:00\",\"2025-08-13T09:30:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.82}"
                },
                {
                    "input": "Hey, my name is Aryan and I am interested in sedans.",
                    "output": "Hey Aryan! Nice to meet you. Sedans are great - what's your budget range? I want to make sure I show you the best options.\n{\"next_action\":\"ask_clarify\",\"confidence\":0.8}"
                },
                {
                    "input": "Around 30k",
                    "output": "Perfect! I've got a 2022 Tiguan SE for $29,900 and a 2021 Honda CR-V for $25,500. Both are in fantastic shape and right in your range. The Tiguan especially has been flying off the lot. Want to come see them today around 4 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T16:00:00-07:00\",\"2025-08-13T09:45:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.85}"
                },
                {
                    "input": "Under 25k",
                    "output": "Great! I've got a 2021 Honda Civic EX for $19,800 and a 2020 Toyota Corolla for $18,500. Both are super reliable and under your budget. The Civic especially has been really popular, great gas mileage and fun to drive. Want to come take a look today around 4 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T16:00:00-07:00\",\"2025-08-13T09:45:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.85}"
                },
                {
                    "input": "Goodbye, thanks for your help",
                    "output": "You're welcome! Thanks for reaching out. Don't hesitate to text me if you have any other questions.\n{\"next_action\":\"end_conversation\",\"confidence\":0.95}"
                }
            ]
        }
    
    def _get_relevant_examples(self, example_type: str) -> str:
        """Get relevant few-shot examples for the prompt."""
        examples = self.few_shot_examples.get(example_type, [])
        
        if not examples:
            return ""
        
        examples_text = "--- FEW-SHOT MICRO-EXAMPLES ---\n\n"
        for i, example in enumerate(examples, 1):
            examples_text += f"{chr(64+i)}) {example['input']}\n"
            examples_text += f"User: \"{example['input']}\"\n"
            examples_text += f"Assistant: \"{example['output']}\"\n\n"
        
        return examples_text 