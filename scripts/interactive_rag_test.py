"""
Interactive RAG Testing Environment

Usage:
    python scripts/interactive_rag_test.py [--dealership-id DEALER_ID] [--debug]

Commands:
    - Type your message to chat with RAG
    - 'clear' - Clear conversation history and start fresh
    - 'exit' or 'quit' - Exit and cleanup
    - 'debug on/off' - Toggle debug mode
    - 'stats' - Show conversation statistics
"""

import asyncio
import sys
import signal
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from uuid import uuid4
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Import existing modules
from maqro_backend.db.session import AsyncSessionLocal
from maqro_backend.core.config import settings
from maqro_rag import EnhancedRAGService, DatabaseRAGRetriever, Config
from maqro_backend.services.ai_services import analyze_conversation_context


# ANSI color codes for terminal output
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    CYAN = '\033[36m'
    RED = '\033[31m'
    MAGENTA = '\033[35m'


class InteractiveRAGSession:
    """Interactive RAG testing session with database persistence."""

    def __init__(self, dealership_id: str, debug: bool = False):
        self.dealership_id = dealership_id
        self.debug = debug
        self.test_lead_id = None
        self.db_session = None
        self.rag_service = None
        self.retriever = None
        self.message_count = 0
        self.start_time = datetime.now()

    async def initialize(self):
        """Initialize database connection and RAG service."""
        print(f"{Colors.CYAN}🔄 Initializing RAG testing environment...{Colors.RESET}")

        # Create database session directly (don't use context manager)
        self.db_session = AsyncSessionLocal()

        try:
            # Initialize RAG components
            rag_config = Config.from_yaml(settings.rag_config_path)
            self.retriever = DatabaseRAGRetriever(config=rag_config)
            self.rag_service = EnhancedRAGService(
                retriever=self.retriever,
                analyze_conversation_context_func=analyze_conversation_context
            )

            # Create test lead
            await self._create_test_lead()

            print(f"{Colors.GREEN}✅ RAG system initialized{Colors.RESET}")
            print(f"{Colors.GREEN}✅ Test lead created: {self.test_lead_id}{Colors.RESET}")
            print()
        except Exception as e:
            await self.db_session.rollback()
            raise e

    async def _create_test_lead(self):
        """Create a test lead in the database."""
        self.test_lead_id = str(uuid4())
        now = datetime.now()

        try:
            await self.db_session.execute(
                text("""
                    INSERT INTO leads (id, name, phone, email, car_interest, source, status, dealership_id, created_at, last_contact_at)
                    VALUES (:id, :name, :phone, :email, :car_interest, :source, :status, :dealership_id, :created_at, :last_contact_at)
                """),
                {
                    "id": self.test_lead_id,
                    "name": "Interactive Test User",
                    "phone": "+15005550001",
                    "email": "interactive.test@example.com",
                    "car_interest": "Testing",
                    "source": "Interactive Test",
                    "status": "new",
                    "dealership_id": self.dealership_id,
                    "created_at": now,
                    "last_contact_at": now
                }
            )
            await self.db_session.commit()
        except Exception as e:
            await self.db_session.rollback()
            raise e

    async def send_message(self, message: str) -> Tuple[str, Dict[str, Any]]:
        """
        Send message to RAG and get response.

        Returns:
            Tuple of (response_text, debug_info)
        """
        try:
            # 1. Save customer message to database (using conversations table)
            await self.db_session.execute(
                text("""
                    INSERT INTO conversations (id, lead_id, message, sender, created_at)
                    VALUES (:id, :lead_id, :message, :sender, :created_at)
                """),
                {
                    "id": str(uuid4()),
                    "lead_id": self.test_lead_id,
                    "message": message,
                    "sender": "customer",
                    "created_at": datetime.now()
                }
            )
            await self.db_session.commit()
            self.message_count += 1

            # 2. Load full conversation history (using conversations table)
            result = await self.db_session.execute(
                text("""
                    SELECT id, message, sender, created_at
                    FROM conversations
                    WHERE lead_id = :lead_id
                    ORDER BY created_at ASC
                """),
                {"lead_id": self.test_lead_id}
            )
            conversations = [dict(row._mapping) for row in result.fetchall()]

            # 3. Search for vehicles
            vehicles = await self.rag_service.search_vehicles_with_context(
                session=self.db_session,
                dealership_id=self.dealership_id,
                query=message,
                conversations=conversations,
                top_k=5
            )

            # 4. Generate RAG response
            rag_response = self.rag_service.generate_enhanced_response(
                query=message,
                vehicles=vehicles,
                conversations=conversations,
                lead_name="Test User",
                dealership_name="Test Dealership",
                lead_id=self.test_lead_id
            )

            response_text = rag_response['response_text']

            # 5. Save agent response to database (using conversations table)
            await self.db_session.execute(
                text("""
                    INSERT INTO conversations (id, lead_id, message, sender, created_at)
                    VALUES (:id, :lead_id, :message, :sender, :created_at)
                """),
                {
                    "id": str(uuid4()),
                    "lead_id": self.test_lead_id,
                    "message": response_text,
                    "sender": "agent",
                    "created_at": datetime.now()
                }
            )
            await self.db_session.commit()

            # 6. Build debug info
            debug_info = {
                'vehicles': vehicles,
                'vehicles_found': len(vehicles),
                'signal_count': rag_response.get('context_analysis', {}).get('conversation_length', 0),
                'state': 'UNKNOWN',  # Could extract from state manager
                'retrieval_score': rag_response.get('retrieval_score', 0),
                'handoff': rag_response.get('should_handoff', False),
                'handoff_reason': rag_response.get('handoff_reason', ''),
            }

            return response_text, debug_info

        except Exception as e:
            await self.db_session.rollback()
            raise e

    async def clear_conversation(self):
        """Delete all messages for this test lead."""
        try:
            await self.db_session.execute(
                text("DELETE FROM conversations WHERE lead_id = :lead_id"),
                {"lead_id": self.test_lead_id}
            )
            await self.db_session.commit()
            self.message_count = 0
            self.start_time = datetime.now()
        except Exception as e:
            await self.db_session.rollback()
            raise e

    async def show_stats(self):
        """Show conversation statistics."""
        duration = datetime.now() - self.start_time
        minutes = int(duration.total_seconds() // 60)
        seconds = int(duration.total_seconds() % 60)

        print(f"\n{Colors.CYAN}📊 Session Statistics:{Colors.RESET}")
        print(f"  Messages sent: {self.message_count}")
        print(f"  Session duration: {minutes}m {seconds}s")
        print(f"  Dealership ID: {self.dealership_id}")
        print(f"  Test Lead ID: {self.test_lead_id}")
        print()

    async def cleanup(self):
        """Cleanup resources and conversation."""
        print(f"\n{Colors.YELLOW}🧹 Cleaning up...{Colors.RESET}")

        # Show final stats
        await self.show_stats()

        try:
            # Clear conversation from database
            await self.clear_conversation()

            # Delete test lead
            await self.db_session.execute(
                text("DELETE FROM leads WHERE id = :id"),
                {"id": self.test_lead_id}
            )
            await self.db_session.commit()

        except Exception as e:
            await self.db_session.rollback()
            print(f"{Colors.RED}⚠️  Error during cleanup: {e}{Colors.RESET}")

        # Close database session
        if self.db_session:
            await self.db_session.close()

        print(f"{Colors.GREEN}✅ Cleanup complete. Goodbye!{Colors.RESET}")


# UI Helper Functions
def print_header():
    """Print welcome header."""
    print(f"{Colors.CYAN}{'='*80}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}   MAQRO RAG INTERACTIVE TESTING ENVIRONMENT{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*80}{Colors.RESET}")
    print()
    print("Commands:")
    print("  - Type your message to chat")
    print("  - 'clear' - Clear conversation and start fresh")
    print("  - 'debug on/off' - Toggle debug information")
    print("  - 'stats' - Show conversation statistics")
    print("  - 'exit' or 'quit' - Exit cleanly")
    print()

def print_vehicles(vehicles: List[Dict[str, Any]]):
    """Print vehicles found (if any)."""
    if not vehicles:
        return

    print(f"\n{Colors.CYAN}  🚗 Found {len(vehicles)} vehicles:{Colors.RESET}")
    for i, result in enumerate(vehicles[:5], 1):
        vehicle = result.get('vehicle', {})
        year = vehicle.get('year', '')
        make = vehicle.get('make', '')
        model = vehicle.get('model', '')
        price = vehicle.get('price', 'N/A')

        if price != 'N/A':
            price = f"${price:,}"

        print(f"{Colors.CYAN}    {i}. {year} {make} {model} - {price}{Colors.RESET}")
    print()

def print_debug_info(info: Dict[str, Any]):
    """Print debug information about RAG decision."""
    print(f"{Colors.YELLOW}  [DEBUG]{Colors.RESET}")
    print(f"{Colors.YELLOW}    Vehicles Found: {info.get('vehicles_found', 0)}{Colors.RESET}")
    print(f"{Colors.YELLOW}    Retrieval Score: {info.get('retrieval_score', 0):.2%}{Colors.RESET}")
    print(f"{Colors.YELLOW}    Handoff: {info.get('handoff', False)}{Colors.RESET}")
    if info.get('handoff_reason'):
        print(f"{Colors.YELLOW}    Handoff Reason: {info.get('handoff_reason')}{Colors.RESET}")
    print()


async def main_loop(session: InteractiveRAGSession):
    """Main interactive loop."""

    print_header()
    print(f"{Colors.GREEN}✅ Connected to dealership: {session.dealership_id}{Colors.RESET}")
    print(f"{Colors.GREEN}✅ Test lead created: {session.test_lead_id}{Colors.RESET}")
    print()
    print(f"{Colors.YELLOW}Start chatting! Type your message below:{Colors.RESET}")
    print()

    while True:
        try:
            # Get user input
            user_input = input(f"{Colors.GREEN}👤 YOU: {Colors.RESET}").strip()

            # Handle special commands
            if not user_input:
                continue

            if user_input.lower() in ['exit', 'quit']:
                print(f"\n{Colors.YELLOW}👋 Exiting and cleaning up...{Colors.RESET}")
                await session.cleanup()
                break

            if user_input.lower() == 'clear':
                print(f"\n{Colors.YELLOW}🧹 Clearing conversation history...{Colors.RESET}")
                await session.clear_conversation()
                print(f"{Colors.GREEN}✅ Conversation cleared! Starting fresh.{Colors.RESET}\n")
                continue

            if user_input.lower().startswith('debug'):
                parts = user_input.split()
                if len(parts) == 2:
                    session.debug = (parts[1].lower() == 'on')
                    status = "enabled" if session.debug else "disabled"
                    print(f"{Colors.YELLOW}🔧 Debug mode {status}{Colors.RESET}\n")
                continue

            if user_input.lower() == 'stats':
                await session.show_stats()
                continue

            # Send message to RAG
            print()  # Blank line for readability
            response, debug_info = await session.send_message(user_input)

            # Show vehicles if found
            if debug_info.get('vehicles'):
                print_vehicles(debug_info['vehicles'])

            # Print agent response
            print(f"{Colors.BLUE}🤖 RAG: {Colors.RESET}{response}")

            # Show debug info if enabled
            if session.debug:
                print_debug_info(debug_info)

            print()  # Blank line for next input

        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}⚠️  Ctrl+C detected. Cleaning up...{Colors.RESET}")
            await session.cleanup()
            break
        except Exception as e:
            print(f"\n{Colors.RED}❌ Error: {e}{Colors.RESET}")
            if session.debug:
                import traceback
                traceback.print_exc()


async def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Interactive RAG Testing')
    parser.add_argument('--dealership-id',
                       default='23c7eafa-7497-427f-9d43-c084e465c059',
                       help='Dealership ID for testing')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug mode')

    args = parser.parse_args()

    # Create session
    session = InteractiveRAGSession(
        dealership_id=args.dealership_id,
        debug=args.debug
    )

    try:
        # Initialize
        await session.initialize()

        # Run main loop
        await main_loop(session)

    except Exception as e:
        print(f"{Colors.RED}Fatal error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
    finally:
        if session.db_session:
            await session.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
