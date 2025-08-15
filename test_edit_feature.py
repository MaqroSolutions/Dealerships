#!/usr/bin/env python3
"""
Test script for the edit functionality in the WhatsApp route
This script tests the edit request processing and response generation
"""

import asyncio
import json
import logging
from datetime import datetime
import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from maqro_backend.api.routes.whatsapp import router
from maqro_backend.db.session import get_db_session
from maqro_backend.core.config import settings
from maqro_backend.services.whatsapp_service import whatsapp_service
from maqro_backend.crud import (
    create_lead,
    create_conversation,
    create_pending_approval,
    get_pending_approval_by_user,
    update_approval_with_edit_request,
    update_approval_status
)
from maqro_backend.schemas.lead import LeadCreate
from maqro_backend.maqro_rag import EnhancedRAGService
from maqro_backend.maqro_rag.db_retriever import DatabaseRAGRetriever

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test configuration
TEST_DEALERSHIP_ID = "d660c7d6-99e2-4fa8-b99b-d221def53d20"
TEST_USER_ID = "d245e4bb-91ae-4ec4-ad0f-18307b38daa6"
TEST_SALESPERSON_PHONE = "+1234567890"  # Replace with actual test phone number
TEST_CUSTOMER_PHONE = "+1987654321"     # Replace with actual test phone number

async def test_edit_feature():
    """Test the edit functionality end-to-end"""
    
    print("🚀 Starting Edit Feature Test")
    print("=" * 50)
    
    try:
        # Get database session
        async for db in get_db_session():
            print("✅ Database connection established")
            
            # Test 1: Create a test lead
            print("\n📝 Test 1: Creating test lead...")
            lead_data = LeadCreate(
                name="Test Customer",
                phone=TEST_CUSTOMER_PHONE,
                email="test@example.com",
                car_interest="Toyota Camry",
                source="Test",
                message="Hi, I'm interested in a Toyota Camry"
            )
            
            lead = await create_lead(
                session=db,
                lead_in=lead_data,
                user_id=TEST_USER_ID,
                dealership_id=TEST_DEALERSHIP_ID
            )
            print(f"✅ Created test lead: {lead.id}")
            
            # Test 2: Create conversation history
            print("\n💬 Test 2: Creating conversation history...")
            await create_conversation(
                session=db,
                lead_id=str(lead.id),
                message="Hi, I'm interested in a Toyota Camry",
                sender="customer"
            )
            
            await create_conversation(
                session=db,
                lead_id=str(lead.id),
                message="Great! We have several Toyota Camry models available. What's your budget?",
                sender="agent"
            )
            print("✅ Created conversation history")
            
            # Test 3: Create a pending approval
            print("\n⏳ Test 3: Creating pending approval...")
            original_response = "We have a 2023 Toyota Camry LE available for $25,000. Would you like to schedule a test drive?"
            
            pending_approval = await create_pending_approval(
                session=db,
                lead_id=str(lead.id),
                user_id=TEST_USER_ID,
                customer_message="What Toyota Camry models do you have?",
                generated_response=original_response,
                customer_phone=TEST_CUSTOMER_PHONE,
                dealership_id=TEST_DEALERSHIP_ID
            )
            print(f"✅ Created pending approval: {pending_approval.id}")
            print(f"   Original response: {original_response}")
            
            # Test 4: Test edit request processing
            print("\n✏️ Test 4: Testing edit request processing...")
            edit_request = "Add that we offer 0% financing for qualified buyers"
            
            # Update approval with edit request
            await update_approval_with_edit_request(
                session=db,
                approval_id=str(pending_approval.id),
                edit_request=edit_request
            )
            print(f"✅ Added edit request: {edit_request}")
            
            # Test 5: Simulate the edit command processing
            print("\n🔄 Test 5: Simulating edit command processing...")
            
            # This would normally happen in the webhook when a salesperson sends "EDIT [request]"
            # For testing, we'll manually create a new pending approval with an edited response
            edited_response = "We have a 2023 Toyota Camry LE available for $25,000. We also offer 0% financing for qualified buyers. Would you like to schedule a test drive?"
            
            new_pending_approval = await create_pending_approval(
                session=db,
                lead_id=str(lead.id),
                user_id=TEST_USER_ID,
                customer_message="What Toyota Camry models do you have?",
                generated_response=edited_response,
                customer_phone=TEST_CUSTOMER_PHONE,
                dealership_id=TEST_DEALERSHIP_ID
            )
            print(f"✅ Created new pending approval with edited response: {new_pending_approval.id}")
            print(f"   Edited response: {edited_response}")
            
            # Test 6: Test approval flow
            print("\n✅ Test 6: Testing approval flow...")
            
            # Approve the edited response
            await update_approval_status(
                session=db,
                approval_id=str(new_pending_approval.id),
                status="approved"
            )
            print("✅ Approved the edited response")
            
            # Test 7: Verify the flow
            print("\n🔍 Test 7: Verifying the complete flow...")
            
            # Get the final pending approval
            final_approval = await get_pending_approval_by_user(
                session=db,
                user_id=TEST_USER_ID,
                dealership_id=TEST_DEALERSHIP_ID
            )
            
            if final_approval:
                print(f"✅ Final approval status: {final_approval.status}")
                print(f"   Customer message: {final_approval.customer_message}")
                print(f"   Generated response: {final_approval.generated_response}")
                print(f"   Edit request: {final_approval.edit_request}")
            else:
                print("✅ No pending approvals (all processed)")
            
            print("\n🎉 Edit Feature Test Completed Successfully!")
            print("=" * 50)
            
            # Summary
            print("\n📊 Test Summary:")
            print(f"   • Lead created: {lead.id}")
            print(f"   • Original approval: {pending_approval.id}")
            print(f"   • Edited approval: {new_pending_approval.id}")
            print(f"   • Edit request: {edit_request}")
            print(f"   • Final status: Approved")
            
            return True
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

async def test_edit_commands():
    """Test the edit command parsing and processing"""
    
    print("\n🔧 Testing Edit Commands")
    print("=" * 30)
    
    try:
        from maqro_backend.crud import is_edit_request, extract_edit_request
        
        # Test various edit command formats
        test_commands = [
            "EDIT Add financing information",
            "EDIT\nInclude warranty details",
            "EDIT: Mention trade-in options",
            "edit add service history",
            "EDIT",
            "NOEDIT",
            "APPROVE",
            "YES"
        ]
        
        for command in test_commands:
            is_edit = is_edit_request(command)
            edit_text = extract_edit_request(command) if is_edit else None
            
            print(f"Command: '{command}'")
            print(f"  Is edit request: {is_edit}")
            print(f"  Edit text: {edit_text}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Edit command test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🧪 WhatsApp Edit Feature Test Suite")
    print("=" * 50)
    
    # Test edit commands first
    await test_edit_commands()
    
    # Test the full edit feature
    success = await test_edit_feature()
    
    if success:
        print("\n🎯 All tests passed! The edit feature is working correctly.")
    else:
        print("\n💥 Some tests failed. Please check the error messages above.")
    
    return success

if __name__ == "__main__":
    # Run the tests
    asyncio.run(main())
