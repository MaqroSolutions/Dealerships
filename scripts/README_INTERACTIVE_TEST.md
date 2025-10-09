# Interactive RAG Testing Environment

## Overview
An interactive terminal-based tool for testing the RAG system with real database persistence and conversation context.

## Features
- ✅ **Interactive conversation** - Chat with the RAG in real-time
- ✅ **Database persistence** - All messages saved and retrieved from database
- ✅ **Context accumulation** - RAG remembers previous conversation turns
- ✅ **Vehicle display** - Shows found vehicles with formatting
- ✅ **Debug mode** - Toggle detailed RAG decision info
- ✅ **Clean exit** - Automatically clears test data on exit
- ✅ **Color-coded** - Easy to distinguish customer/agent messages

## Installation

No external dependencies needed! Uses built-in Python ANSI color codes.

## Usage

### Basic Usage
```bash
python scripts/interactive_rag_test.py
```

### With Specific Dealership
```bash
python scripts/interactive_rag_test.py --dealership-id YOUR_DEALER_ID
```

### With Debug Mode Enabled
```bash
python scripts/interactive_rag_test.py --debug
```

## Commands

While chatting, you can use these special commands:

| Command | Description |
|---------|-------------|
| `clear` | Clear conversation history and start fresh |
| `debug on` | Enable debug mode (shows signal counts, retrieval decisions) |
| `debug off` | Disable debug mode |
| `stats` | Show conversation statistics (messages sent, duration, etc.) |
| `exit` or `quit` | Exit cleanly and cleanup test data |

## Example Session

```
================================================================================
   MAQRO RAG INTERACTIVE TESTING ENVIRONMENT
================================================================================

Commands:
  - Type your message to chat
  - 'clear' - Clear conversation and start fresh
  - 'debug on/off' - Toggle debug information
  - 'stats' - Show conversation statistics
  - 'exit' or 'quit' - Exit cleanly

🔄 Initializing RAG testing environment...
✅ RAG system initialized
✅ Test lead created: abc-123-def
✅ Connected to dealership: 23c7eafa-7497-427f-9d43-c084e465c059

Start chatting! Type your message below:

👤 YOU: I'm looking for a sedan

🤖 RAG: Got it - sedan. What's your budget range?

👤 YOU: Around $25k

  🚗 Found 3 vehicles:
    1. 2020 Honda Civic - $23,500
    2. 2019 Toyota Corolla - $21,800
    3. 2021 Hyundai Elantra - $25,900

🤖 RAG: Great! We have several sedans in your budget. Here are some top picks...

👤 YOU: Tell me about the Civic

🤖 RAG: The 2020 Honda Civic is a great choice! It has 35,000 miles...

👤 YOU: clear

🧹 Clearing conversation history...
✅ Conversation cleared! Starting fresh.

👤 YOU: exit

👋 Exiting and cleaning up...

🧹 Cleaning up...

📊 Session Statistics:
  Messages sent: 3
  Session duration: 1m 45s
  Dealership ID: 23c7eafa-7497-427f-9d43-c084e465c059
  Test Lead ID: abc-123-def

✅ Cleanup complete. Goodbye!
```

## Testing Scenarios

### Test 1: Budget-Only Query (Should Ask Questions)
```
👤 YOU: I'm interested in cars under $30k
🤖 RAG: Perfect - $30k gives you lots of options. What type are you looking for?
```

### Test 2: Budget + Type (Should Show Vehicles)
```
👤 YOU: Show me sedans under $25k
🤖 RAG: [Shows 3-5 sedans with prices]
```

### Test 3: Specific Model (Should Show Immediately)
```
👤 YOU: Do you have any Honda Civics?
🤖 RAG: [Shows Honda Civics]
```

### Test 4: Multi-Turn Context Accumulation
```
👤 YOU: I need something reliable
🤖 RAG: What type of vehicle are you looking for?

👤 YOU: Sedan
🤖 RAG: What's your budget?

👤 YOU: $25k
🤖 RAG: [Shows sedans under $25k - remembered "sedan" from 2 turns ago]
```

## Debug Mode

Enable debug mode to see RAG decision-making:

```
👤 YOU: debug on
🔧 Debug mode enabled

👤 YOU: Show me sedans

  🚗 Found 5 vehicles:
    1. 2020 Honda Civic - $23,500
    ...

🤖 RAG: Here are some great sedans...

  [DEBUG]
    Vehicles Found: 5
    Retrieval Score: 78.45%
    Handoff: False
```

## Tips

1. **Start simple** - Test basic queries first ("I need a car")
2. **Test edge cases** - Try vague queries, specific models, budget-only
3. **Use clear often** - Reset context between different test scenarios
4. **Enable debug** - See what signals RAG is detecting
5. **Check stats** - Monitor message counts and session duration

## Troubleshooting

### Error: "Database connection failed"
- Make sure your `.env` file is configured correctly
- Check that the database is running

### Error: "Dealership not found"
- Use `--dealership-id` flag with a valid dealership ID from your database

### Messages not persisting
- Check that the `conversations` table exists in your database
- Verify the test lead is being created successfully

## Development

The tool uses:
- **Database**: Real PostgreSQL tables (`leads`, `conversations`)
- **RAG Service**: Full EnhancedRAGService with retrieval
- **Context**: Loads full conversation history from database
- **Cleanup**: Deletes test lead and conversations on exit

## Notes

- Each session creates a new test lead with phone `+15005550001`
- All messages are stored in the database during the session
- On exit, the test lead and all messages are automatically deleted
- Uses ANSI color codes (works on most terminals)
