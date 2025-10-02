"""
Short-term conversation memory with Redis/DB-backed persistence.

This module provides conversation memory management for the RAG system,
including turn storage, slot extraction, and pronoun resolution.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

try:
    import redis  # type: ignore
except Exception:  # optional dependency in local runs
    redis = None  # noqa


@dataclass
class AppointmentDetails:
    """Structured appointment information."""
    date: Optional[str] = None
    time: Optional[str] = None
    vehicle: Optional[str] = None
    confirmed: bool = False
    created_at: Optional[str] = None

@dataclass
class ConversationMemory:
    """
    Conversation memory for storing turns, slots, and vehicle references.
    
    This class manages short-term conversation context including:
    - Recent conversation turns
    - Extracted entity slots (budget, body type, etc.)
    - Vehicle references for pronoun resolution
    - Appointment details for test drives
    """
    conversation_id: str
    max_turns: int = 5
    slots: Dict[str, Any] = field(default_factory=dict)
    turns: List[Dict[str, Any]] = field(default_factory=list)
    last_inventory_mention: Optional[Dict[str, Any]] = None
    recent_vehicles: List[Dict[str, Any]] = field(default_factory=list)
    appointment: Optional[AppointmentDetails] = None

    def add_turn(self, role: str, text: str, meta: Optional[Dict[str, Any]] = None) -> None:
        """
        Add a conversation turn to memory.
        
        Args:
            role: 'customer' or 'agent'
            text: The message content
            meta: Optional metadata
        """
        turn = {
            "role": role, 
            "text": text, 
            "ts": datetime.utcnow().isoformat(), 
            "meta": meta or {}
        }
        self.turns.append(turn)
        
        # Keep only the most recent turns
        if len(self.turns) > self.max_turns:
            self.turns = self.turns[-self.max_turns:]

    def update_slots(self, new_slots: Dict[str, Any]) -> None:
        """
        Update extracted slots with new information.
        
        Args:
            new_slots: Dictionary of slot updates
        """
        for key, value in (new_slots or {}).items():
            if value is not None and value != "":
                self.slots[key] = value
                logger.debug(f"Updated slot '{key}': {value}")

    def set_last_inventory_mention(self, vehicle: Dict[str, Any]) -> None:
        """
        Set the last mentioned vehicle for pronoun resolution.
        
        Args:
            vehicle: Vehicle dictionary
        """
        self.last_inventory_mention = vehicle
        logger.debug(f"Set last inventory mention: {vehicle.get('model', 'Unknown')}")

    def resolve_pronoun(
        self, 
        phrase: str, 
        recent_vehicles: List[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Resolve pronouns based on recent conversation context and vehicles mentioned.
        
        Args:
            phrase: The phrase containing the pronoun
            recent_vehicles: List of recently mentioned vehicles
            
        Returns:
            Resolved vehicle dictionary or None
        """
        text = (phrase or "").lower()
        
        # Check if phrase contains pronoun patterns
        if not self._contains_pronoun_patterns(text):
            return None
            
        # Use recent vehicles if available
        if recent_vehicles and len(recent_vehicles) > 0:
            return self._resolve_from_recent_vehicles(text, recent_vehicles)
        
        # Fallback to last inventory mention
        return self.last_inventory_mention

    def _contains_pronoun_patterns(self, text: str) -> bool:
        """Check if text contains pronoun patterns that need resolution."""
        pronoun_patterns = [
            "that one", "the first one", "the second one", "the third one",
            "the one you mentioned", "the one with", "the one that",
            "the cheaper one", "the more expensive one", "the newer one", "the older one"
        ]
        return any(pattern in text for pattern in pronoun_patterns)

    def _resolve_from_recent_vehicles(
        self, 
        text: str, 
        recent_vehicles: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Resolve pronoun from recent vehicles list."""
        if "first" in text or "cheaper" in text:
            return recent_vehicles[0]  # First/cheapest option
        elif "second" in text or "more expensive" in text:
            return recent_vehicles[1] if len(recent_vehicles) > 1 else recent_vehicles[0]
        elif "newer" in text:
            return self._find_newest_vehicle(recent_vehicles)
        elif "older" in text:
            return self._find_oldest_vehicle(recent_vehicles)
        else:
            return recent_vehicles[0]  # Default to first mentioned

    def _find_newest_vehicle(self, vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Find the newest vehicle by year."""
        return max(vehicles, key=lambda v: v.get('year', 0))

    def _find_oldest_vehicle(self, vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Find the oldest vehicle by year."""
        return min(vehicles, key=lambda v: v.get('year', 0))

    def get_conversation_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the conversation memory.
        
        Returns:
            Dictionary with conversation summary
        """
        return {
            "conversation_id": self.conversation_id,
            "turn_count": len(self.turns),
            "slots": self.slots,
            "has_inventory_mention": self.last_inventory_mention is not None,
            "recent_vehicles_count": len(self.recent_vehicles)
        }

    def set_appointment(self, date: str, time: str, vehicle: str = None) -> None:
        """
        Set appointment details.
        
        Args:
            date: Appointment date
            time: Appointment time
            vehicle: Vehicle for test drive (optional)
        """
        self.appointment = AppointmentDetails(
            date=date,
            time=time,
            vehicle=vehicle,
            confirmed=True,
            created_at=datetime.utcnow().isoformat()
        )
        logger.debug(f"Set appointment: {date} at {time} for {vehicle or 'vehicle'}")

    def get_appointment_summary(self) -> str:
        """Get a natural language summary of the appointment."""
        if not self.appointment or not self.appointment.confirmed:
            return "No appointment scheduled"
        
        parts = []
        if self.appointment.date:
            parts.append(self.appointment.date)
        if self.appointment.time:
            parts.append(self.appointment.time)
        if self.appointment.vehicle:
            parts.append(f"for the {self.appointment.vehicle}")
        
        return " ".join(parts) if parts else "Appointment scheduled"

    def has_appointment(self) -> bool:
        """Check if an appointment is scheduled."""
        return self.appointment is not None and self.appointment.confirmed

    def clear_old_turns(self, max_age_hours: int = 24) -> None:
        """
        Clear turns older than specified age.
        
        Args:
            max_age_hours: Maximum age of turns to keep
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        self.turns = [
            turn for turn in self.turns 
            if datetime.fromisoformat(turn.get('ts', '1970-01-01T00:00:00')) > cutoff_time
        ]


class MemoryStore:
    """
    Storage adapter for conversation memory with optional Redis backend.
    
    This class handles persistence of conversation memory with fallback
    to in-memory storage when Redis is not available.
    """

    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize memory store.
        
        Args:
            redis_url: Optional Redis URL for persistence
        """
        self._client = None
        self._fallback: Dict[str, Dict[str, Any]] = {}
        
        if redis_url and redis is not None:
            try:
                self._client = redis.from_url(redis_url, decode_responses=True)
                logger.info("Connected to Redis for memory storage")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}. Using in-memory storage.")
                self._client = None

    def load(self, conversation_id: str) -> ConversationMemory:
        """
        Load conversation memory by ID.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            ConversationMemory object
        """
        key = self._key(conversation_id)
        
        if self._client:
            try:
                data = self._client.get(key)
                if data:
                    return self._load_from_redis_data(conversation_id, data)
            except Exception as e:
                logger.error(f"Error loading from Redis: {e}")
        
        # Fallback to in-memory storage
        return self._load_from_fallback(conversation_id, key)

    def save(self, memory: ConversationMemory) -> None:
        """
        Save conversation memory.
        
        Args:
            memory: ConversationMemory object to save
        """
        key = self._key(memory.conversation_id)
        payload = self._build_payload(memory)
        
        if self._client:
            try:
                import json
                self._client.setex(key, timedelta(days=7), json.dumps(payload))
                logger.debug(f"Saved memory to Redis: {memory.conversation_id}")
            except Exception as e:
                logger.error(f"Error saving to Redis: {e}")
        
        # Always save to fallback as well
        self._fallback[key] = payload

    def delete(self, conversation_id: str) -> None:
        """
        Delete conversation memory.
        
        Args:
            conversation_id: Conversation ID to delete
        """
        key = self._key(conversation_id)
        
        if self._client:
            try:
                self._client.delete(key)
            except Exception as e:
                logger.error(f"Error deleting from Redis: {e}")
        
        # Remove from fallback
        self._fallback.pop(key, None)

    def _key(self, conversation_id: str) -> str:
        """Generate storage key for conversation ID."""
        return f"conv_mem:{conversation_id}"

    def _load_from_redis_data(self, conversation_id: str, data: str) -> ConversationMemory:
        """Load memory from Redis data."""
        import json
        obj = json.loads(data)
        mem = ConversationMemory(conversation_id=conversation_id)
        mem.slots = obj.get("slots", {})
        mem.turns = obj.get("turns", [])
        mem.last_inventory_mention = obj.get("last_inventory_mention")
        mem.recent_vehicles = obj.get("recent_vehicles", [])
        
        # Load appointment data
        appointment_data = obj.get("appointment")
        if appointment_data:
            mem.appointment = AppointmentDetails(**appointment_data)
        
        return mem

    def _load_from_fallback(self, conversation_id: str, key: str) -> ConversationMemory:
        """Load memory from fallback storage."""
        obj = self._fallback.get(key) or {}
        mem = ConversationMemory(conversation_id=conversation_id)
        mem.slots = obj.get("slots", {})
        mem.turns = obj.get("turns", [])
        mem.last_inventory_mention = obj.get("last_inventory_mention")
        mem.recent_vehicles = obj.get("recent_vehicles", [])
        
        # Load appointment data
        appointment_data = obj.get("appointment")
        if appointment_data:
            mem.appointment = AppointmentDetails(**appointment_data)
        
        return mem

    def _build_payload(self, memory: ConversationMemory) -> Dict[str, Any]:
        """Build payload for storage."""
        payload = {
            "slots": memory.slots,
            "turns": memory.turns,
            "last_inventory_mention": memory.last_inventory_mention,
            "recent_vehicles": memory.recent_vehicles,
        }
        
        # Add appointment data if exists
        if memory.appointment:
            payload["appointment"] = {
                "date": memory.appointment.date,
                "time": memory.appointment.time,
                "vehicle": memory.appointment.vehicle,
                "confirmed": memory.appointment.confirmed,
                "created_at": memory.appointment.created_at
            }
        
        return payload

    def get_stats(self) -> Dict[str, Any]:
        """
        Get storage statistics.
        
        Returns:
            Dictionary with storage stats
        """
        return {
            "redis_connected": self._client is not None,
            "fallback_entries": len(self._fallback),
            "storage_type": "redis" if self._client else "in-memory"
        }