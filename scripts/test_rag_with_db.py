#!/usr/bin/env python3
"""
Test RAG system with real data from the database.

This script creates a consistent test lead and simulates conversations by inserting
them into the database, then testing the RAG system with that real data.

Usage:
    # Run all predefined test scenarios
    python scripts/test_rag_with_db.py

    # Run a specific test scenario
    python scripts/test_rag_with_db.py --scenario budget_conversation

    # List available scenarios
    python scripts/test_rag_with_db.py --list-scenarios

    # Interactive mode (no database insertion, just live testing)
    python scripts/test_rag_with_db.py --interactive
"""

import asyncio
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "src"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import argparse
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import uuid

# Import RAG components
from maqro_rag import EnhancedRAGService, Config
from maqro_rag.db_retriever import DatabaseRAGRetriever
from maqro_backend.core.config import settings
from maqro_backend.services.ai_services import analyze_conversation_context


# Test conversation scenarios
TEST_SCENARIOS = {
    "budget_conversation": {
        "name": "Budget-based vehicle search",
        "description": "Customer specifies budget and asks for vehicles",
        "conversation": [
            {"sender": "customer", "message": "Hi, I'm looking for a car"},
            {"sender": "agent", "message": "Great! What's your budget range?"},
            {"sender": "customer", "message": "Around $25,000"},
        ],
        "test_message": "Do you have any sedans?"
    },
    "specific_model": {
        "name": "Specific model inquiry",
        "description": "Customer asks for a specific make/model",
        "conversation": [
            {"sender": "customer", "message": "Hi"},
            {"sender": "agent", "message": "Hello! How can I help you today?"},
        ],
        "test_message": "Do you have any Toyota Camrys?"
    },
    "test_drive_scheduling": {
        "name": "Test drive scheduling",
        "description": "Customer wants to schedule a test drive",
        "conversation": [
            {"sender": "customer", "message": "I'm interested in the 2021 Honda Accord"},
            {"sender": "agent", "message": "Great choice! Would you like to schedule a test drive?"},
            {"sender": "customer", "message": "Yes, I'd like to schedule a test drive"},
            {"sender": "agent", "message": "Perfect! What day and time work best for you?"},
            {"sender": "customer", "message": "Tomorrow at 2pm"},
        ],
        "test_message": "Actually, can we do 3pm instead?"
    },
    "context_memory_test": {
        "name": "Context memory test",
        "description": "Tests if RAG remembers previous context",
        "conversation": [
            {"sender": "customer", "message": "I need a reliable car for commuting"},
            {"sender": "agent", "message": "Great! What's your budget?"},
            {"sender": "customer", "message": "Up to $30,000"},
            {"sender": "agent", "message": "Perfect. Are you looking for a sedan or SUV?"},
            {"sender": "customer", "message": "Sedan"},
        ],
        "test_message": "Show me what you have"  # Should remember: sedan, $30k budget, commuting
    },
    "pronoun_resolution": {
        "name": "Pronoun resolution",
        "description": "Tests if RAG can resolve pronouns like 'the first one'",
        "conversation": [
            {"sender": "customer", "message": "Show me some SUVs under $35,000"},
            {"sender": "agent", "message": "Here are 3 great options:\n1. 2020 Honda CR-V - $28,500\n2. 2021 Toyota RAV4 - $32,000\n3. 2019 Mazda CX-5 - $26,500"},
        ],
        "test_message": "Tell me more about the first one"
    },
    "multi_turn_refinement": {
        "name": "Multi-turn refinement",
        "description": "Customer refines their search over multiple turns",
        "conversation": [
            {"sender": "customer", "message": "I'm looking for a car"},
            {"sender": "agent", "message": "What type of vehicle are you interested in?"},
            {"sender": "customer", "message": "Something fuel efficient"},
            {"sender": "agent", "message": "Great! What's your budget range?"},
            {"sender": "customer", "message": "Around $20,000 to $25,000"},
            {"sender": "agent", "message": "Perfect. Are you looking at sedans or hybrids?"},
            {"sender": "customer", "message": "Sedans preferably"},
        ],
        "test_message": "What do you have in stock?"
    },
    "financing_handoff": {
        "name": "Financing question (handoff trigger)",
        "description": "Customer asks about financing, should trigger handoff",
        "conversation": [
            {"sender": "customer", "message": "I'm interested in the 2022 Toyota Camry"},
            {"sender": "agent", "message": "Excellent choice! It's priced at $26,500. Would you like more details?"},
        ],
        "test_message": "What are the financing options if I have bad credit?"
    },
    "trade_in_handoff": {
        "name": "Trade-in question (handoff trigger)",
        "description": "Customer asks about trade-in, should trigger handoff",
        "conversation": [
            {"sender": "customer", "message": "Do you have any used trucks?"},
            {"sender": "agent", "message": "Yes, we have several trucks available. What's your budget?"},
            {"sender": "customer", "message": "Around $30,000"},
        ],
        "test_message": "I have a 2017 Nissan Altima to trade in. How much is it worth?"
    },
    "greeting_only": {
        "name": "Simple greeting",
        "description": "Customer just says hi, RAG should respond naturally",
        "conversation": [],
        "test_message": "Hey"
    },
    "vague_browsing": {
        "name": "Vague browsing",
        "description": "Customer is just browsing without specifics",
        "conversation": [
            {"sender": "customer", "message": "Hi"},
            {"sender": "agent", "message": "Hello! How can I help you today?"},
        ],
        "test_message": "Just looking around"
    }
}


class RAGTester:
    """Test harness for RAG system with database integration."""

    def __init__(self):
        """Initialize the RAG tester."""
        self.engine = None
        self.session_maker = None
        self.rag_service = None
        self.db_retriever = None
        self.test_lead_id = None
        self.test_dealership_id = None

    async def setup(self):
        """Set up database connection and RAG service."""
        # Get database URL
        database_url = settings.supabase_db_url or settings.database_url

        if not database_url:
            raise ValueError("No database URL found in environment variables")

        # Convert to async URL
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        print(f"🔗 Connecting to database...")

        # Create async engine
        self.engine = create_async_engine(
            database_url,
            echo=False,
            pool_pre_ping=True
        )

        # Create session maker
        self.session_maker = sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

        # Load RAG configuration
        rag_config = Config.from_yaml(settings.rag_config_path)

        # Initialize database retriever
        self.db_retriever = DatabaseRAGRetriever(rag_config)

        # Initialize RAG service
        self.rag_service = EnhancedRAGService(
            retriever=self.db_retriever,
            analyze_conversation_context_func=analyze_conversation_context
        )

        print("✅ RAG system initialized")

        # Set up test lead
        await self.setup_test_lead()

    async def cleanup(self):
        """Clean up database connections."""
        if self.engine:
            await self.engine.dispose()

    async def setup_test_lead(self):
        """Create or get the consistent test lead."""
        async with self.session_maker() as session:
            # Use specific dealership ID
            self.test_dealership_id = "23c7eafa-7497-427f-9d43-c084e465c059"

            # Verify dealership exists
            dealership_query = text("SELECT id, name FROM dealerships WHERE id = :dealership_id")
            result = await session.execute(dealership_query, {"dealership_id": self.test_dealership_id})
            dealership = result.fetchone()

            if not dealership:
                raise ValueError(f"Dealership {self.test_dealership_id} not found in database.")

            dealership_name = dealership.name

            # Check if test lead exists
            test_phone = "+15005550000"
            lead_query = text("""
                SELECT id FROM leads
                WHERE phone = :phone AND dealership_id = :dealership_id
            """)
            result = await session.execute(lead_query, {
                "phone": test_phone,
                "dealership_id": self.test_dealership_id
            })
            existing_lead = result.fetchone()

            if existing_lead:
                self.test_lead_id = str(existing_lead.id)
                print(f"✅ Using existing test lead: {self.test_lead_id}")
            else:
                # Create test lead
                self.test_lead_id = str(uuid.uuid4())
                now = datetime.utcnow()
                insert_query = text("""
                    INSERT INTO leads (id, name, phone, email, car_interest, source, status, dealership_id, created_at, last_contact_at)
                    VALUES (:id, :name, :phone, :email, :car_interest, :source, :status, :dealership_id, :created_at, :last_contact_at)
                """)
                await session.execute(insert_query, {
                    "id": self.test_lead_id,
                    "name": "RAG Test Customer",
                    "phone": test_phone,
                    "email": "rag.test@example.com",
                    "car_interest": "Various",
                    "source": "Test",
                    "status": "new",
                    "dealership_id": self.test_dealership_id,
                    "created_at": now,
                    "last_contact_at": now
                })
                await session.commit()
                print(f"✅ Created new test lead: {self.test_lead_id}")

            print(f"🏢 Dealership: {dealership_name} ({self.test_dealership_id})")

    async def clear_conversation_history(self):
        """Clear all conversation history for the test lead."""
        async with self.session_maker() as session:
            delete_query = text("""
                DELETE FROM conversations WHERE lead_id = :lead_id
            """)
            await session.execute(delete_query, {"lead_id": self.test_lead_id})
            await session.commit()
            print("🧹 Cleared conversation history")

    async def insert_conversation(self, messages: List[Dict[str, str]]):
        """
        Insert a conversation into the database.

        Args:
            messages: List of messages with 'sender' and 'message' keys
        """
        async with self.session_maker() as session:
            for msg in messages:
                conversation_id = str(uuid.uuid4())
                insert_query = text("""
                    INSERT INTO conversations (id, lead_id, message, sender, created_at)
                    VALUES (:id, :lead_id, :message, :sender, :created_at)
                """)
                await session.execute(insert_query, {
                    "id": conversation_id,
                    "lead_id": self.test_lead_id,
                    "message": msg["message"],
                    "sender": msg["sender"],
                    "created_at": datetime.utcnow()
                })
            await session.commit()
            print(f"✅ Inserted {len(messages)} messages into database")

    async def get_conversation_history(self) -> List[Dict]:
        """Get conversation history for the test lead from database."""
        async with self.session_maker() as session:
            query = text("""
                SELECT id, message, sender, created_at
                FROM conversations
                WHERE lead_id = :lead_id
                ORDER BY created_at ASC
            """)
            result = await session.execute(query, {"lead_id": self.test_lead_id})
            rows = result.fetchall()

            return [
                {
                    "id": str(row.id),
                    "message": row.message,
                    "sender": row.sender,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                }
                for row in rows
            ]

    async def get_dealership_name(self) -> str:
        """Get the test dealership name."""
        async with self.session_maker() as session:
            query = text("SELECT name FROM dealerships WHERE id = :dealership_id")
            result = await session.execute(query, {"dealership_id": self.test_dealership_id})
            row = result.fetchone()
            return row.name if row else "Unknown Dealership"

    def _analyze_conversation_context(self, conversations: List[Dict]) -> Dict[str, Any]:
        """
        Analyze conversation context to extract intent, preferences, etc.

        This is a simple implementation. You can enhance it based on your needs.
        """
        context = {
            "intent": "general_inquiry",
            "preferences": {},
            "urgency": "medium",
            "budget_range": None,
            "vehicle_type": None,
            "conversation_length": len(conversations)
        }

        # Simple heuristics
        all_text = " ".join([c.get("message", "") for c in conversations]).lower()

        # Detect intent
        if "test drive" in all_text or "schedule" in all_text:
            context["intent"] = "test_drive"
        elif "financing" in all_text or "payment" in all_text:
            context["intent"] = "financing"
        elif "price" in all_text or "cost" in all_text:
            context["intent"] = "pricing"
        elif "available" in all_text or "in stock" in all_text:
            context["intent"] = "availability"

        # Detect vehicle type
        if "suv" in all_text:
            context["vehicle_type"] = "SUV"
        elif "sedan" in all_text:
            context["vehicle_type"] = "Sedan"
        elif "truck" in all_text:
            context["vehicle_type"] = "Truck"

        # Detect budget (simple pattern matching)
        import re
        budget_pattern = r'\$?(\d{1,3}(?:,?\d{3})*)'
        matches = re.findall(budget_pattern, all_text)
        if matches:
            try:
                amounts = [int(m.replace(",", "")) for m in matches]
                if amounts:
                    min_amount = min(amounts)
                    max_amount = max(amounts)
                    if max_amount > min_amount:
                        context["budget_range"] = (min_amount, max_amount)
                    elif max_amount == min_amount:
                        # Single budget mentioned, use it as upper bound
                        context["budget_range"] = (0, max_amount)
            except:
                pass

        return context

    async def run_test_scenario(self, scenario_name: str):
        """
        Run a single test scenario.

        Args:
            scenario_name: Name of the scenario from TEST_SCENARIOS
        """
        if scenario_name not in TEST_SCENARIOS:
            print(f"❌ Unknown scenario: {scenario_name}")
            return

        scenario = TEST_SCENARIOS[scenario_name]

        print(f"\n{'='*80}")
        print(f"🧪 TEST SCENARIO: {scenario['name']}")
        print(f"📝 Description: {scenario['description']}")
        print(f"{'='*80}\n")

        # Step 1: Clear conversation history
        await self.clear_conversation_history()

        # Step 2: Insert scenario conversation into database
        if scenario['conversation']:
            print("💾 Inserting conversation into database...")
            await self.insert_conversation(scenario['conversation'])

        # Step 3: Retrieve conversation from database (to verify)
        conversations = await self.get_conversation_history()

        print(f"\n📜 Conversation History ({len(conversations)} messages):")
        print("-" * 80)
        for conv in conversations:
            sender = "👤 CUSTOMER" if conv['sender'] == 'customer' else "🤖 AGENT"
            print(f"{sender}: {conv['message']}")
        print("-" * 80)

        # Step 4: Test with the test message
        test_message = scenario['test_message']
        print(f"\n📨 Test Message: {test_message}\n")

        # Step 5: Search for vehicles
        print("🔍 Searching for vehicles...")
        async with self.session_maker() as session:
            vehicles = await self.rag_service.search_vehicles_with_context(
                session=session,
                dealership_id=self.test_dealership_id,
                query=test_message,
                conversations=conversations,
                top_k=3
            )

        print(f"✅ Found {len(vehicles)} vehicles\n")

        if vehicles:
            print("🚗 Top Matching Vehicles:")
            for i, result in enumerate(vehicles, 1):
                vehicle = result['vehicle']
                score = result['similarity_score']
                print(f"  {i}. {vehicle.get('year', 'N/A')} {vehicle.get('make', 'N/A')} {vehicle.get('model', 'N/A')}")
                print(f"     Price: ${vehicle.get('price', 'N/A'):,}")
                print(f"     Match Score: {score:.2%}")
            print()

        # Step 6: Generate response
        dealership_name = await self.get_dealership_name()

        print("🤖 Generating RAG Response...\n")
        response = self.rag_service.generate_enhanced_response(
            query=test_message,
            vehicles=vehicles,
            conversations=conversations,
            lead_name="RAG Test Customer",
            dealership_name=dealership_name,
            lead_id=self.test_lead_id
        )

        # Step 7: Display results
        print("="*80)
        print("💬 GENERATED RESPONSE:")
        print("="*80)
        print(response['response_text'])
        print("="*80)

        # Metadata
        print("\n📊 Response Metadata:")
        print(f"  • Vehicles Found: {response.get('vehicles_found', 0)}")
        print(f"  • Should Handoff: {response.get('should_handoff', False)}")
        if response.get('should_handoff'):
            print(f"  • Handoff Reason: {response.get('handoff_reason', 'N/A')}")
            print(f"  • Handoff Reasoning: {response.get('handoff_reasoning', 'N/A')}")
        print(f"  • Retrieval Score: {response.get('retrieval_score', 0):.2%}")

        quality = response.get('quality_metrics', {})
        print(f"\n📈 Quality Metrics:")
        print(f"  • Relevance: {quality.get('relevance_score', 0):.2%}")
        print(f"  • Completeness: {quality.get('completeness_score', 0):.2%}")
        print(f"  • Personalization: {quality.get('personalization_score', 0):.2%}")
        print(f"  • Actionability: {quality.get('actionability_score', 0):.2%}")
        print(f"  • Overall: {quality.get('overall_score', 0):.2%}")

        # Analysis
        print(f"\n🔍 Analysis:")
        self._analyze_test_results(scenario, response, conversations, vehicles)

        print(f"\n{'='*80}\n")

    def _analyze_test_results(self, scenario: Dict, response: Dict, conversations: List[Dict], vehicles: List[Dict]):
        """Analyze test results and provide insights."""
        issues = []
        successes = []

        # Check context memory
        if len(conversations) > 0:
            # Check if response references previous context
            all_previous_text = " ".join([c['message'] for c in conversations]).lower()
            response_text = response['response_text'].lower()

            # Budget memory check
            if "$" in all_previous_text and "budget" not in response_text:
                # This might be OK if budget is remembered implicitly
                pass

            # Check for repeated questions
            previous_questions = [c['message'] for c in conversations if c['sender'] == 'agent' and '?' in c['message']]
            if any('?' in q and response_text.find(q.lower()) > -1 for q in previous_questions):
                issues.append("⚠️  RAG may be repeating previous questions")

        # Check handoff logic
        if scenario['name'] in ['Financing question (handoff trigger)', 'Trade-in question (handoff trigger)']:
            if response.get('should_handoff'):
                successes.append("✅ Correctly triggered handoff for " + response.get('handoff_reason', 'unknown'))
            else:
                issues.append("❌ Failed to trigger handoff for financing/trade-in question")

        # Check vehicle retrieval
        if "show me" in scenario['test_message'].lower() or "what do you have" in scenario['test_message'].lower():
            if len(vehicles) > 0:
                successes.append(f"✅ Retrieved {len(vehicles)} relevant vehicles")
            else:
                issues.append("⚠️  No vehicles retrieved despite customer request")

        # Display findings
        if successes:
            for success in successes:
                print(f"  {success}")

        if issues:
            for issue in issues:
                print(f"  {issue}")

        if not successes and not issues:
            print("  ℹ️  No specific issues or successes detected")

    async def run_all_scenarios(self):
        """Run all test scenarios."""
        print(f"\n{'#'*80}")
        print(f"# RUNNING ALL RAG TEST SCENARIOS")
        print(f"# Total scenarios: {len(TEST_SCENARIOS)}")
        print(f"{'#'*80}")

        for scenario_name in TEST_SCENARIOS.keys():
            await self.run_test_scenario(scenario_name)
            # Small delay between scenarios
            await asyncio.sleep(0.5)

        print(f"\n{'#'*80}")
        print(f"# ALL SCENARIOS COMPLETE")
        print(f"{'#'*80}\n")

    async def interactive_mode(self):
        """Interactive testing mode without database insertion."""
        print(f"\n🎮 Interactive RAG Testing Mode")
        print(f"🏢 Dealership ID: {self.test_dealership_id}")
        print(f"👤 Test Lead ID: {self.test_lead_id}")
        print("\nCommands:")
        print("  - Type your message to test RAG")
        print("  - 'reset' - clear conversation history")
        print("  - 'history' - show current conversation")
        print("  - 'exit' - quit interactive mode")
        print()

        await self.clear_conversation_history()
        dealership_name = await self.get_dealership_name()

        while True:
            user_input = input("👤 YOU: ").strip()

            if user_input.lower() == 'exit':
                break
            elif user_input.lower() == 'reset':
                await self.clear_conversation_history()
                print("🔄 Conversation reset\n")
                continue
            elif user_input.lower() == 'history':
                conversations = await self.get_conversation_history()
                print(f"\n📜 Conversation History ({len(conversations)} messages):")
                for conv in conversations:
                    sender = "👤 CUSTOMER" if conv['sender'] == 'customer' else "🤖 AGENT"
                    print(f"{sender}: {conv['message']}")
                print()
                continue
            elif not user_input:
                continue

            # Insert user message into database
            await self.insert_conversation([{"sender": "customer", "message": user_input}])

            # Get conversation history from database
            conversations = await self.get_conversation_history()

            # Search for vehicles
            async with self.session_maker() as session:
                vehicles = await self.rag_service.search_vehicles_with_context(
                    session=session,
                    dealership_id=self.test_dealership_id,
                    query=user_input,
                    conversations=conversations,
                    top_k=3
                )

            # Generate response
            response = self.rag_service.generate_enhanced_response(
                query=user_input,
                vehicles=vehicles,
                conversations=conversations,
                lead_name="RAG Test Customer",
                dealership_name=dealership_name,
                lead_id=self.test_lead_id
            )

            # Insert agent response into database
            await self.insert_conversation([{"sender": "agent", "message": response['response_text']}])

            # Display response
            print(f"🤖 RAG: {response['response_text']}")

            # Show metadata if handoff or vehicles found
            if response.get('should_handoff'):
                print(f"   ⚠️  Handoff: {response.get('handoff_reason', 'N/A')}")
            if vehicles:
                print(f"   🚗 Found {len(vehicles)} vehicles")

            print()

    def list_scenarios(self):
        """List all available test scenarios."""
        print(f"\n📋 Available Test Scenarios ({len(TEST_SCENARIOS)}):")
        print("="*80)
        for name, scenario in TEST_SCENARIOS.items():
            print(f"\n🔹 {name}")
            print(f"   {scenario['description']}")
            print(f"   Turns: {len(scenario['conversation'])}, Test message: \"{scenario['test_message']}\"")
        print("="*80)


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test RAG system with database-backed conversations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all test scenarios
  python scripts/test_rag_with_db.py

  # Run specific scenario
  python scripts/test_rag_with_db.py --scenario context_memory_test

  # List all scenarios
  python scripts/test_rag_with_db.py --list-scenarios

  # Interactive mode
  python scripts/test_rag_with_db.py --interactive
        """
    )
    parser.add_argument("--scenario", help="Run a specific test scenario")
    parser.add_argument("--list-scenarios", action="store_true", help="List all available scenarios")
    parser.add_argument("--interactive", action="store_true", help="Interactive testing mode")

    args = parser.parse_args()

    tester = RAGTester()

    try:
        # List scenarios without setup
        if args.list_scenarios:
            tester.list_scenarios()
            return

        # Setup for all other operations
        await tester.setup()

        if args.interactive:
            await tester.interactive_mode()
        elif args.scenario:
            await tester.run_test_scenario(args.scenario)
        else:
            # Run all scenarios by default
            await tester.run_all_scenarios()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await tester.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
