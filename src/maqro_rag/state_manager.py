"""
Conversation state machine for Maqro.

States: GREETING → DISCOVERY → NARROWING → RECOMMENDATION → SCHEDULE → HANDOFF

Each state constrains allowed actions and governs transitions based on extracted
signals from the conversation (entities, specificity, explicit scheduling intent, etc.).
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum, auto
from typing import Dict, Any, Optional, Tuple


class ConversationState(Enum):
    GREETING = auto()
    DISCOVERY = auto()
    NARROWING = auto()
    RECOMMENDATION = auto()
    SCHEDULE = auto()
    HANDOFF = auto()


@dataclass
class StateSnapshot:
    state: ConversationState
    reason: str


class ConversationStateManager:
    """Finite state controller for conversation flow.

    Transition rules (simplified):
    - Start in GREETING. After first user reply, move to DISCOVERY.
    - In DISCOVERY: only ask follow-ups until we have key constraints
      (e.g., body_type/model or budget or use_case). When constraints grow
      sufficiently specific, move to NARROWING.
    - In NARROWING: validate/clarify specifics. When we have a coherent ask
      like "sedan for commuting under 25k" (type + budget or model), move to RECOMMENDATION.
    - In RECOMMENDATION: offer 1–2 options. If user picks a specific time or confirms
      interest in a test drive, move to SCHEDULE.
    - In SCHEDULE: once a time is agreed or booking confirmed, move to HANDOFF.
    - Any time legal/compliance/financing/trade-in appear, jump to HANDOFF.
    """

    def __init__(self, initial_state: ConversationState = ConversationState.GREETING):
        self._state = initial_state

    @property
    def state(self) -> ConversationState:
        return self._state

    def allowed_actions(self) -> Dict[str, bool]:
        """Return which action types are allowed in the current state."""
        s = self._state
        return {
            "small_talk": s in {ConversationState.GREETING, ConversationState.DISCOVERY, ConversationState.NARROWING},
            "ask_follow_up": s in {ConversationState.GREETING, ConversationState.DISCOVERY, ConversationState.NARROWING},
            "recommend": s in {ConversationState.RECOMMENDATION},
            "schedule": s in {ConversationState.SCHEDULE},
            "handoff": s in {ConversationState.HANDOFF},
            # Inventory retrieval gating handled upstream; state advises
            "retrieve_inventory": s in {ConversationState.NARROWING, ConversationState.RECOMMENDATION},
        }

    def should_retrieve_inventory(self) -> bool:
        return self._state in {ConversationState.NARROWING, ConversationState.RECOMMENDATION}

    def next(self, signals: Dict[str, Any]) -> StateSnapshot:
        """Advance state based on extracted signals.

        Expected signals:
        - has_specific_model: bool
        - has_vehicle_type: bool
        - has_budget: bool
        - explicit_schedule_intent: bool
        - legal_or_finance_or_trade: bool
        - appointment_confirmed: bool
        - turns_seen: int
        """

        if signals.get("legal_or_finance_or_trade"):
            self._state = ConversationState.HANDOFF
            return StateSnapshot(self._state, "Triggered by financing/trade/legal topic")

        if self._state == ConversationState.GREETING:
            # After first user message, move into discovery
            self._state = ConversationState.DISCOVERY
            return StateSnapshot(self._state, "Move from greeting to discovery")

        if self._state == ConversationState.DISCOVERY:
            if self._has_min_constraints(signals):
                self._state = ConversationState.NARROWING
                return StateSnapshot(self._state, "Have initial constraints; begin narrowing")
            return StateSnapshot(self._state, "Keep gathering constraints")

        if self._state == ConversationState.NARROWING:
            if self._is_recommendation_ready(signals):
                self._state = ConversationState.RECOMMENDATION
                return StateSnapshot(self._state, "Ready to recommend 1–2 cars")
            return StateSnapshot(self._state, "Clarify to reach recommendation threshold")

        if self._state == ConversationState.RECOMMENDATION:
            if signals.get("explicit_schedule_intent"):
                self._state = ConversationState.SCHEDULE
                return StateSnapshot(self._state, "Customer wants to schedule")
            return StateSnapshot(self._state, "Continue recommending at most 1–2 options")

        if self._state == ConversationState.SCHEDULE:
            if signals.get("appointment_confirmed"):
                self._state = ConversationState.HANDOFF
                return StateSnapshot(self._state, "Appointment booked; handoff to salesperson")
            return StateSnapshot(self._state, "Offer concrete time slots")

        # HANDOFF is terminal in this simple flow
        return StateSnapshot(self._state, "Handoff state")

    def _has_min_constraints(self, signals: Dict[str, Any]) -> bool:
        """Move to NARROWING if customer provided ANY constraint."""
        return bool(
            signals.get("has_specific_model") or
            signals.get("has_vehicle_type") or
            signals.get("has_budget")
        )

    def _is_recommendation_ready(self, signals: Dict[str, Any]) -> bool:
        # Recommend when model is specified OR type+budget present
        return bool(
            signals.get("has_specific_model") or (
                signals.get("has_vehicle_type") and signals.get("has_budget")
            )
        )

    @staticmethod
    def extract_signals(nlp_entities: Dict[str, Any], last_5_turns: Optional[list]) -> Dict[str, Any]:
        """Convert parsed entities/history into transition signals."""
        budget_present = bool(nlp_entities.get("budget"))
        model_present = bool(nlp_entities.get("model"))
        type_present = bool(nlp_entities.get("body_type") or nlp_entities.get("vehicle_type"))

        text_window = " ".join(t.get("text", "") for t in (last_5_turns or []))
        text_lower = text_window.lower()

        legal_finance_trade = any(
            kw in text_lower for kw in [
                "financing", "apr", "credit", "monthly payment",
                "trade-in", "trade in", "legal", "policy", "terms",
            ]
        )

        schedule_intent = any(kw in text_lower for kw in ["test drive", "come by", "swing by", "schedule"])
        appointment_confirmed = any(kw in text_lower for kw in ["see you at", "confirmed", "booked"])

        return {
            "has_budget": budget_present,
            "has_specific_model": model_present,
            "has_vehicle_type": type_present,
            "explicit_schedule_intent": schedule_intent,
            "appointment_confirmed": appointment_confirmed,
            "legal_or_finance_or_trade": legal_finance_trade,
        }


