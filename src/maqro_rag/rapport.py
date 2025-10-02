"""
RapportLibrary: natural phrase variations for small talk, discovery, transitions, and scheduling.
"""

from __future__ import annotations

import random
from typing import Dict, List


class RapportLibrary:
    def __init__(self, seed: int = 0):
        self._rand = random.Random(seed)
        self._library: Dict[str, List[str]] = {
            "greeting": [
                "Hey! How's your day going?",
                "Hi there! What brings you in today?",
                "Hey! I'm doing well. Was there a car you were interested in?",
                "Hi! Happy to help—what can I do for you?",
            ],
            "acknowledgment": [
                "Sure thing.",
                "Absolutely.",
                "Got it.",
                "That's a great choice.",
                "Perfect.",
                "Sounds good.",
                "Makes sense.",
            ],
            "discovery": [
                "What matters most in your next car?",
                "Are you looking for something practical or sporty?",
                "What's most important to you—fuel economy, space, or features?",
                "Do you need room for family or mostly solo commutes?",
            ],
            "recommendation": [
                "We've got a couple in that range.",
                "I've got a few options that might work.",
                "Let me show you what we have.",
                "Here are a couple that could be a good fit.",
            ],
            "schedule_prompt": [
                "Want me to check availability for a test drive?",
                "Would you like to set up a time to see it in person?",
                "Want to swing by and take a look?",
                "Should I check what times work for a test drive?",
            ],
            "appointment_confirmation": [
                "Got it, you're locked in for {time}.",
                "Perfect! I'll make sure the car's ready for you at {time}.",
                "You're all set for {time}. Looking forward to it!",
                "Great! I'll have everything ready for your {time} appointment.",
            ],
            "appointment_reminder": [
                "Do you want me to send a quick reminder tomorrow morning?",
                "I can shoot you a text reminder if you'd like.",
                "Want me to give you a heads up before your appointment?",
            ],
            "appointment_info": [
                "You're set for {time}.",
                "Your appointment is at {time}.",
                "You're locked in for {time}.",
                "I have you down for {time}.",
            ],
            "light_response": [
                "Of course, happy to help!",
                "No problem at all!",
                "Glad I could help!",
                "You're welcome!",
                "Anytime!",
            ],
        }

    def sample(self, category: str) -> str:
        choices = self._library.get(category, [])
        if not choices:
            return ""
        return self._rand.choice(choices)
    
    def get_appointment_confirmation(self, time: str) -> str:
        """Get a natural appointment confirmation with time."""
        template = self.sample("appointment_confirmation")
        return template.format(time=time)
    
    def get_appointment_info(self, time: str) -> str:
        """Get appointment information response."""
        template = self.sample("appointment_info")
        return template.format(time=time)
    
    def get_light_response(self) -> str:
        """Get a light, rapport-building response."""
        return self.sample("light_response")


