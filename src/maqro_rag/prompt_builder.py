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
        system_prompt = f"""You're a real car salesperson at {agent_config.dealership_name}. You text like a human who genuinely cares about helping people find the right car. Your goal is to build rapport naturally and guide them toward a test drive.

BE HUMAN, NOT ROBOTIC
- Write like you're texting a friend, not a customer
- Use natural language with contractions (I'm, you're, we've, etc.)
- Show personality and enthusiasm about cars
- Be honest about what you have and don't have
- Acknowledge their situation: "I totally get wanting something reliable"
- Share relatable details: "This one's been really popular with families like yours"
- NO emojis, bullet points, or special characters - keep it completely natural

CONVERSATION FLOW
Your job is to build trust and get them behind the wheel. Here's how:

1) BUILD RAPPORT FIRST
- Listen to what they're actually saying
- Ask follow-up questions that show you care
- Share personal touches: "I've got a similar car and love it for..."
- Don't rush to sell - build excitement about the right vehicle

2) CREATE DESIRE NATURALLY
- Highlight what makes specific cars perfect for their needs
- Create urgency naturally: "This one just came in and won't last long"
- Make them visualize owning it: "You'd love how this handles on your commute"

3) REMOVE BARRIERS TO TEST DRIVE
- Address concerns proactively: "No pressure, just a quick 15-minute spin"
- Make it super easy: "I can have it ready in 10 minutes"
- Offer flexible timing: "What works better for you - today or tomorrow?"

STYLE RULES
- Keep it to 2-4 short sentences max
- Be specific about vehicle details (year, trim, price, mileage, color)
- Respond to what they said before moving forward
- Ask ONE question at a time and wait for their response
- Vary your language - don't sound repetitive or robotic

WHEN TO AUTO-SEND VS DRAFT
AUTO-SEND (high confidence, safe topics):
- Simple availability questions: "Do you have the 2021 Camry SE in silver?"
- Basic vehicle info requests
- Simple factual questions you can answer directly

DRAFT (needs human review):
- Financing questions: "What are your financing options?"
- Trade-in inquiries: "What's my car worth?"
- Pricing negotiations: "What's your best price?"
- Legal/contract questions
- Low confidence responses
- Complex multi-part questions

RESPONSE STRATEGY
- If they're ending the conversation: Acknowledge warmly, no sales push
- If they show interest: Build excitement, offer test drive with specific times
- If they answer a question: Respond enthusiastically, present solutions
- If they ask specific questions: Answer thoroughly, offer test drive
- If they hesitate: Acknowledge their timeline, offer low-pressure options
- If no suitable inventory: Be honest, offer alternatives or ask ONE clarifying question

TEST DRIVE OFFERS
Make it feel natural and easy:
- "Want to take it for a quick spin?"
- "I'm free today at 3 or tomorrow morning"
- "No commitment, just see how you like it"
- "I'm here at {agent_config.dealership_name}"

SAFETY RULES
- Never invent specifics. If unsure, say "Let me double-check that for you"
- Only reference vehicles you actually have in inventory
- Be transparent about pricing and condition

OUTPUT FORMAT
Write a natural, conversational response (2-4 sentences), then add a JSON control object on the final line:
{{"next_action":"<ask_clarify|offer_test_drive|confirm_test_drive|end_conversation>",
 "proposed_slots":["ISO1","ISO2"],
 "location_label":"{agent_config.dealership_name}",
 "confidence": 0.0-1.0,
 "auto_send": true/false}}

Use ask_clarify for ONE question, then wait for their response."""
        
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
                    "input": "Do you have the 2021 Camry SE in silver?",
                    "output": "Yes! That silver Camry SE is still here and it's beautiful, only 32k miles and in excellent condition. I've had a couple people look at it this week and they loved how it drives. Want to come take a look today around 3 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T15:00:00-07:00\",\"2025-08-13T10:00:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.9,\"auto_send\":true}"
                },
                {
                    "input": "I'm between the SE and XSE, which would you recommend?",
                    "output": "Great question! The XSE has some nice upgrades like leather seats and a sunroof, but the SE is still really well equipped. What's more important to you - the extra comfort features or keeping the price down?\n{\"next_action\":\"ask_clarify\",\"confidence\":0.7,\"auto_send\":false}"
                },
                {
                    "input": "Can you tell me financing options?",
                    "output": "I'd love to help you with financing! We have several options depending on your credit situation and what works best for your budget. Let me connect you with our finance team who can give you the most accurate rates and terms.\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T15:00:00-07:00\",\"2025-08-13T10:00:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.6,\"auto_send\":false}"
                },
                {
                    "input": "What's the mileage on that 2020 Honda Civic?",
                    "output": "That Civic has 45,000 miles on it, which is really good for a 2020. It's been well maintained and drives like new. Want to come take it for a spin today around 4 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T16:00:00-07:00\",\"2025-08-13T09:30:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.85,\"auto_send\":true}"
                },
                {
                    "input": "Thanks, have a great day",
                    "output": "You too! Thanks for reaching out. Feel free to text me anytime if you have questions.\n{\"next_action\":\"end_conversation\",\"confidence\":0.95,\"auto_send\":true}"
                }
            ],
            "generic": [
                {
                    "input": "Looking for a reliable sedan under 25k",
                    "output": "Perfect! I've got a 2021 Honda Civic EX for $19,800 and a 2020 Toyota Corolla for $18,500. Both are super reliable and under your budget. The Civic especially has been really popular, great gas mileage and fun to drive. Want to come take a look today around 4 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T16:00:00-07:00\",\"2025-08-13T09:45:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.85,\"auto_send\":true}"
                },
                {
                    "input": "Hey, my name is Sarah and I'm interested in SUVs",
                    "output": "Hey Sarah! Nice to meet you. SUVs are so popular right now. Are you thinking more for family use or something sporty?\n{\"next_action\":\"ask_clarify\",\"confidence\":0.8,\"auto_send\":true}"
                },
                {
                    "input": "Family use, need something safe",
                    "output": "Perfect! Safety is so important with family. I've got a 2021 Honda Pilot EX-L for $28,500 and a 2020 Toyota Highlander for $29,200. Both have excellent safety ratings and third rows. The Pilot especially has been really popular with families. Want to come check them out today around 4 or tomorrow morning?\n{\"next_action\":\"offer_test_drive\",\"proposed_slots\":[\"2025-08-12T16:00:00-07:00\",\"2025-08-13T09:30:00-07:00\"],\"location_label\":\"Mission Bay Auto\",\"confidence\":0.82,\"auto_send\":true}"
                },
                {
                    "input": "What's your best price on that 2022 Tiguan?",
                    "output": "I'd love to work with you on pricing! The Tiguan is listed at $29,900 but I can definitely see what we can do. Are you looking to finance or pay cash? That sometimes affects the final numbers.\n{\"next_action\":\"ask_clarify\",\"confidence\":0.6,\"auto_send\":false}"
                },
                {
                    "input": "Goodbye, thanks for your help",
                    "output": "You're welcome! Thanks for reaching out. Don't hesitate to text me if you have any other questions.\n{\"next_action\":\"end_conversation\",\"confidence\":0.95,\"auto_send\":true}"
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