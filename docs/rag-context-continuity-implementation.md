# RAG Context Continuity Implementation Plan

## Overview
Fix the critical issue where conversation history is not being passed to the LLM during prompt generation, breaking context continuity and causing the RAG to "forget" previous exchanges.

## Problem Statement
Currently, the RAG system:
- ✅ Loads conversation memory (past turns, slots, entities)
- ✅ Stores conversation history in `ConversationMemory`
- ❌ **Does NOT pass conversation history to PromptBuilder**
- ❌ Only passes vehicle info as "context", not actual conversation turns
- ❌ LLM has no awareness of what was said in previous messages

This causes issues like:
- Customer says "tomorrow at 9pm" → RAG asks "what time works for you?"
- Customer mentions a specific car → RAG doesn't remember it
- No conversational continuity or natural flow

## Current Flow (Broken)

```
Customer Message
    ↓
_generate_rag_response()
    ↓
search_vehicles_with_context()
    ↓
generate_enhanced_response()
    ├─ Load memory (line 296) ✅
    ├─ Update memory with current query ✅
    ├─ Store conversation turns ✅
    ↓
_generate_response_text()
    ├─ Build context_string = vehicle info only ❌
    ├─ prompt_builder.build_full_prompt(query, context_string) ❌
    ├─ NO conversation history passed ❌
    ↓
OpenAI generates response without context ❌
```

## Target Flow (Fixed)

```
Customer Message
    ↓
_generate_rag_response()
    ↓
search_vehicles_with_context()
    ↓
generate_enhanced_response()
    ├─ Load memory (line 296) ✅
    ├─ Update memory with current query ✅
    ├─ Store conversation turns ✅
    ↓
_generate_response_text()
    ├─ Build context with:
    │   ├─ Conversation history (last 10 turns) ✅
    │   ├─ Extracted slots (budget, preferences) ✅
    │   ├─ Vehicle info if available ✅
    │   └─ Appointment details if exists ✅
    ├─ prompt_builder.build_full_prompt(query, conversation_history, context) ✅
    ↓
OpenAI generates response WITH full context ✅
```

## Implementation Steps

### Step 1: Update PromptBuilder to Accept Conversation History

**File:** `src/maqro_rag/prompt_builder.py`

**Changes:**

1. **Modify `build_full_prompt()` signature** (line 26-31):
```python
def build_full_prompt(
    self,
    query: str,
    context: str = "",
    conversation_history: List[Dict[str, str]] = None,  # NEW
    agent_config: AgentConfig = None
) -> str:
```

2. **Add conversation history formatting** (new method):
```python
def _format_conversation_history(self, conversation_history: List[Dict[str, str]]) -> str:
    """
    Format conversation history for prompt.

    Args:
        conversation_history: List of conversation turns

    Returns:
        Formatted conversation history string
    """
    if not conversation_history:
        return ""

    # Take last 10 turns for context
    recent_turns = conversation_history[-10:]

    formatted_turns = []
    for turn in recent_turns:
        sender = turn.get('sender', 'customer')
        message = turn.get('message', '')

        # Format based on sender
        if sender == 'customer':
            formatted_turns.append(f"CUSTOMER: {message}")
        else:
            formatted_turns.append(f"AGENT: {message}")

    return "\n".join(formatted_turns)
```

3. **Update `_build_user_prompt()` to include conversation history** (line 181-189):
```python
def _build_user_prompt(
    self,
    query: str,
    context: str = "",
    conversation_history: List[Dict[str, str]] = None
) -> str:
    """Build user prompt with query, conversation history, and context."""

    prompt_parts = []

    # Add conversation history if available
    if conversation_history:
        formatted_history = self._format_conversation_history(conversation_history)
        prompt_parts.append("Recent Conversation History:")
        prompt_parts.append(formatted_history)
        prompt_parts.append("")  # Blank line

    # Add current customer message
    prompt_parts.append(f"CUSTOMER (current message): {query}")

    # Add context (vehicle info, slots, etc.)
    if context:
        prompt_parts.append("")  # Blank line
        prompt_parts.append("Additional Context:")
        prompt_parts.append(context)

    # Add critical reminder about context usage
    if conversation_history:
        prompt_parts.append("")
        prompt_parts.append("IMPORTANT: Use the conversation history above to maintain context. Do not repeat questions already answered. Reference previous exchanges naturally.")

    return "\n".join(prompt_parts)
```

4. **Update `build_full_prompt()` to pass conversation history** (line 26-49):
```python
def build_full_prompt(
    self,
    query: str,
    context: str = "",
    conversation_history: List[Dict[str, str]] = None,
    agent_config: AgentConfig = None
) -> str:
    """
    Build complete prompt with system instructions, conversation history, and user query.

    Args:
        query: User's current message
        context: Additional context (vehicle info, slots, etc.)
        conversation_history: List of previous conversation turns
        agent_config: Agent configuration

    Returns:
        Complete prompt string
    """
    if agent_config is None:
        agent_config = self.agent_config

    system_prompt = self._build_system_prompt(agent_config)
    user_prompt = self._build_user_prompt(query, context, conversation_history)

    return f"{system_prompt}\n\n{user_prompt}"
```

---

### Step 2: Update RAG Enhanced to Pass Conversation History

**File:** `src/maqro_rag/rag_enhanced.py`

**Changes:**

1. **Update `_generate_response_text()` to build richer context** (line 573-610):
```python
def _generate_response_text(
    self,
    query: str,
    vehicles: List[Dict[str, Any]],
    context: ConversationContext,
    lead_name: str,
    dealership_name: str = None
) -> str:
    """Generate response text using PromptBuilder with full conversation context."""

    # Get conversation history from context if available
    conversation_history = getattr(context, 'conversation_history', None)

    # Customize agent config based on context and dealership name
    agent_config = self._get_agent_config_from_context(context, lead_name, dealership_name)

    # Build comprehensive context string
    context_parts = []

    # 1. Vehicle information if available
    if vehicles:
        vehicle_info = "Available vehicles:\n"
        for i, result in enumerate(vehicles[:3], 1):
            vehicle = result.get('vehicle', {})
            year = vehicle.get('year', '')
            make = vehicle.get('make', '')
            model = vehicle.get('model', '')
            price = vehicle.get('price', 'N/A')
            mileage = vehicle.get('mileage', 'N/A')

            if price != 'N/A':
                price = f"${price:,}"

            vehicle_info += f"{i}. {year} {make} {model} - {price}, {mileage} miles\n"

        context_parts.append(vehicle_info)

    # 2. Extracted slots/preferences if available
    if context.preferences:
        prefs = "Customer preferences:\n"
        for key, value in context.preferences.items():
            prefs += f"- {key}: {value}\n"
        context_parts.append(prefs)

    # 3. Budget information
    if context.budget_range:
        min_price, max_price = context.budget_range
        context_parts.append(f"Budget: ${min_price:,} - ${max_price:,}")

    # 4. Vehicle type preference
    if context.vehicle_type:
        context_parts.append(f"Vehicle type preference: {context.vehicle_type}")

    context_string = "\n\n".join(context_parts) if context_parts else ""

    # Use PromptBuilder for response with conversation history
    prompt = self.prompt_builder.build_full_prompt(
        query=query,
        context=context_string,
        conversation_history=conversation_history,
        agent_config=agent_config
    )

    # Generate response using OpenAI (or fallback to template-based)
    try:
        response_text = self._call_openai_with_prompt(prompt)
        # Parse and clean the response to extract only the customer message
        return self._parse_response_text(response_text)
    except Exception as e:
        logger.warning(f"Error calling OpenAI, falling back to template: {e}")
        return self._fallback_template_response(query, vehicles, context, lead_name)
```

2. **Update `generate_enhanced_response()` to ensure conversation_history is in context** (line 276-407):
```python
def generate_enhanced_response(
    self,
    query: str,
    vehicles: List[Dict[str, Any]],
    conversations: List[Dict],
    lead_name: str = None,
    dealership_name: str = None,
    lead_id: str = None
) -> Dict[str, Any]:
    """Generate enhanced AI response with quality scoring and confidence routing."""
    try:
        # Analyze context
        context_analysis = self.analyze_conversation_context(conversations)
        context = ConversationContext(**context_analysis)

        # CRITICAL: Add conversation history to context for PromptBuilder
        context.conversation_history = conversations  # Line 292

        # ... rest of the method stays the same
```

**NOTE:** Line 292 already exists! This is good - we just need to make sure it's being used.

---

### Step 3: Test the Changes

**File:** `tests/test_rag_context_continuity.py` (NEW)

Create a test to verify conversation history is being passed:

```python
"""
Test RAG context continuity fixes.
"""
import pytest
from maqro_rag import EnhancedRAGService
from maqro_rag.prompt_builder import PromptBuilder

def test_prompt_builder_includes_conversation_history():
    """Test that PromptBuilder includes conversation history in prompt."""
    builder = PromptBuilder()

    conversation_history = [
        {"sender": "customer", "message": "Hi, I'm looking for a sedan"},
        {"sender": "agent", "message": "Great! What's your budget range?"},
        {"sender": "customer", "message": "Around $25,000"}
    ]

    prompt = builder.build_full_prompt(
        query="Do you have any Toyota Camrys?",
        context="Vehicle info here",
        conversation_history=conversation_history
    )

    # Verify conversation history is in prompt
    assert "Hi, I'm looking for a sedan" in prompt
    assert "Around $25,000" in prompt
    assert "CUSTOMER:" in prompt
    assert "AGENT:" in prompt

def test_prompt_builder_without_conversation_history():
    """Test that PromptBuilder works without conversation history (backward compatible)."""
    builder = PromptBuilder()

    prompt = builder.build_full_prompt(
        query="Do you have any Toyota Camrys?",
        context="Vehicle info here"
    )

    # Should still work without conversation history
    assert "Do you have any Toyota Camrys?" in prompt
    assert "Vehicle info here" in prompt
```

---

### Step 4: Manual Testing Plan

**Test Case 1: Remembering Budget**
```
Conversation:
1. Customer: "I'm looking for a sedan"
2. Agent: "What's your budget?"
3. Customer: "Around $25,000"
4. Customer: "Do you have any Hondas?" ← Should NOT ask for budget again

Expected: Agent should remember $25,000 budget and show Hondas in that range
```

**Test Case 2: Remembering Time for Test Drive**
```
Conversation:
1. Customer: "I want to schedule a test drive"
2. Agent: "What time works for you?"
3. Customer: "Tomorrow at 2pm"
4. Customer: "Actually, can we do 3pm instead?" ← Should remember "tomorrow"

Expected: Agent should know it's tomorrow and just confirm time change
```

**Test Case 3: Pronoun Resolution**
```
Conversation:
1. Customer: "Show me some SUVs"
2. Agent: "Here are 3 SUVs: [lists vehicles]"
3. Customer: "Tell me more about the first one" ← Should know which vehicle

Expected: Agent should provide details about the first SUV mentioned
```

---

## Pros and Cons

### Pros
✅ **Fixes critical context continuity issue** - RAG will remember previous exchanges
✅ **Natural conversation flow** - No repeated questions or forgotten details
✅ **Better customer experience** - Feels like talking to a human who remembers the conversation
✅ **Backward compatible** - Still works without conversation history (for testing)
✅ **Clear separation of concerns** - PromptBuilder handles formatting, RAG handles orchestration
✅ **Easy to debug** - Can inspect the full prompt being sent to LLM

### Cons
⚠️ **Increased token usage** - Sending 10 conversation turns adds ~200-500 tokens per request
⚠️ **Potential cost increase** - More tokens = slightly higher OpenAI API costs (~5-10% increase)
⚠️ **Prompt length limits** - Need to limit conversation history to avoid hitting token limits
⚠️ **Testing complexity** - Need to test with various conversation histories

### Mitigation Strategies
- Limit conversation history to last 10 turns (configurable)
- Use token counting to dynamically adjust history length
- Monitor costs and adjust if needed
- Consider using cheaper model (already using gpt-4o-mini)

---

## Alternative Approaches Considered

### Alternative 1: Fine-tune Model on Conversation Data
**Pros:** Model learns conversation patterns naturally
**Cons:** Expensive, time-consuming, requires large dataset
**Decision:** Not worth it for this issue

### Alternative 2: Use Long-term Memory Service (e.g., Redis)
**Pros:** Can store much longer conversation history
**Cons:** Already have MemoryStore, but not using it in prompts
**Decision:** Fix prompt construction first, then enhance memory later

### Alternative 3: Summary-based Context
**Pros:** Reduces token usage by summarizing conversation
**Cons:** Loses detail, summary quality varies
**Decision:** Start with full history, optimize later if needed

---

## Implementation Timeline

**Phase 1: Core Changes (Day 1)**
- [ ] Update PromptBuilder to accept conversation history
- [ ] Add conversation history formatting method
- [ ] Update _build_user_prompt() to include history

**Phase 2: Integration (Day 1-2)**
- [ ] Update _generate_response_text() to pass conversation history
- [ ] Verify context.conversation_history is populated
- [ ] Test with sample conversations

**Phase 3: Testing (Day 2)**
- [ ] Write unit tests for PromptBuilder
- [ ] Manual testing with real conversations
- [ ] Verify memory persistence works

**Phase 4: Monitoring (Day 3+)**
- [ ] Monitor token usage
- [ ] Track conversation quality improvements
- [ ] Gather customer feedback

---

## Success Metrics

1. **Context Continuity Rate:** % of conversations where RAG remembers previous exchanges
   - Target: >95% (currently ~30%)

2. **Repeated Questions:** Count of times RAG asks for info already provided
   - Target: <5% (currently ~40%)

3. **Customer Satisfaction:** Based on conversation quality
   - Measure through salesperson feedback

4. **Token Usage:** Average tokens per request
   - Monitor and keep under 2000 tokens per request

---

## Rollback Plan

If issues arise:
1. Revert `prompt_builder.py` changes
2. Revert `rag_enhanced.py` changes
3. Deploy previous version
4. System will work as before (without conversation history)

No database changes, so rollback is safe and immediate.

---

## Next Steps After This Feature

Once context continuity is fixed, tackle:
1. **Relax State Machine Gating** - Allow vehicle retrieval in early DISCOVERY
2. **Add Conversation Stage to Prompt** - Help LLM understand where customer is in journey
3. **Improve Test Drive Flow** - Better scheduling push and handoff timing

---

## Notes

- This is the **foundation** for all other conversational improvements
- Without context continuity, other features (tone adaptation, scheduling push) won't work properly
- Test thoroughly with edge cases (long conversations, rapid exchanges, typos)
