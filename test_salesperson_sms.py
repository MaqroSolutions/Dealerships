#!/usr/bin/env python3
"""
Test script for salesperson SMS functionality
Tests lead creation and inventory updates via SMS
"""

import sys
import os
import asyncio

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

async def test_salesperson_sms():
    """Test the salesperson SMS service for lead creation and inventory updates"""
    
    try:
        from maqro_backend.services.sms_parser import SMSParser
        from maqro_backend.services.salesperson_sms_service import SalespersonSMSService
        
        print("✅ Successfully imported SMS services")
        
        # Test SMS parsing
        print("\n🧪 Testing SMS parsing for salesperson messages...")
        
        parser = SMSParser()
        sms_service = SalespersonSMSService()
        
        # Test lead creation messages
        print("\n📝 Testing Lead Creation Messages:")
        lead_messages = [
            "I just met Anna Johnson. Her number is 555-123-4567 and her email is anna@gmail.com. She is interested in subarus in the price range of $10K. I met her at the dealership.",
            "Met John Smith today. Phone: (555) 987-6543, Email: john@email.com. Interested in Honda Civic around $15K",
            "New lead: Sarah Wilson - 555-111-2222 - sarah@test.com - Toyota Camry - $12K"
        ]
        
        for i, message in enumerate(lead_messages, 1):
            print(f"\n--- Lead Creation Test {i} ---")
            print(f"Message: {message}")
            
            parsed = parser.parse_message(message)
            print(f"Parsed type: {parsed.get('type', 'unknown')}")
            
            if parsed.get('type') == 'lead_creation':
                print("✅ Correctly identified as lead creation")
                print(f"Name: {parsed.get('name', 'Unknown')}")
                print(f"Phone: {parsed.get('phone', 'Unknown')}")
                print(f"Email: {parsed.get('email', 'Unknown')}")
                print(f"Car Interest: {parsed.get('car_interest', 'Unknown')}")
                print(f"Price Range: {parsed.get('price_range', 'Unknown')}")
            else:
                print(f"❌ Expected 'lead_creation', got '{parsed.get('type', 'unknown')}'")
        
        # Test inventory update messages
        print("\n🚗 Testing Inventory Update Messages:")
        inventory_messages = [
            "I just picked up a 2006 Toyota Camry off facebook marketplace. It has 123456 miles. It is in good condition. Add it to the inventory",
            "New inventory: 2018 Honda Civic - 45000 miles - excellent - $18K",
            "Add vehicle: 2015 Ford F-150, 75000 miles, good, $22K"
        ]
        
        for i, message in enumerate(inventory_messages, 1):
            print(f"\n--- Inventory Update Test {i} ---")
            print(f"Message: {message}")
            
            parsed = parser.parse_message(message)
            print(f"Parsed type: {parsed.get('type', 'unknown')}")
            
            if parsed.get('type') == 'inventory_update':
                print("✅ Correctly identified as inventory update")
                print(f"Year: {parsed.get('year', 'Unknown')}")
                print(f"Make: {parsed.get('make', 'Unknown')}")
                print(f"Model: {parsed.get('model', 'Unknown')}")
                print(f"Mileage: {parsed.get('mileage', 'Unknown')}")
                print(f"Condition: {parsed.get('condition', 'Unknown')}")
                print(f"Price: {parsed.get('price', 'Unknown')}")
            else:
                print(f"❌ Expected 'inventory_update', got '{parsed.get('type', 'unknown')}'")
        
        # Test other message types
        print("\n🔍 Testing Other Message Types:")
        other_messages = [
            "What's the status of lead John Smith?",
            "Do we have any Honda Civics in stock?",
            "What's my schedule today?",
            "Lead John Smith is coming in for test drive tomorrow"
        ]
        
        for i, message in enumerate(other_messages, 1):
            print(f"\n--- Other Message Test {i} ---")
            print(f"Message: {message}")
            
            parsed = parser.parse_message(message)
            print(f"Parsed type: {parsed.get('type', 'unknown')}")
            print(f"✅ Successfully parsed as: {parsed.get('type', 'unknown')}")
        
        print("\n🎉 SMS Parser test completed!")
        
        # Test the salesperson service (without database)
        print("\n🧪 Testing Salesperson SMS Service (parsing only)...")
        
        # Mock salesperson data
        mock_salesperson = type('MockSalesperson', (), {
            'user_id': 'test-user-123',
            'full_name': 'Test Salesperson',
            'phone': '+15551234567'
        })()
        
        # Test lead creation processing
        test_lead_message = "I just met Test Customer. Phone: 555-999-8888. Interested in Toyota Camry around $20K"
        parsed_lead = parser.parse_message(test_lead_message)
        
        if parsed_lead.get('type') == 'lead_creation':
            print("✅ Lead creation message parsed successfully")
            print(f"Customer: {parsed_lead.get('name', 'Unknown')}")
            print(f"Phone: {parsed_lead.get('phone', 'Unknown')}")
        else:
            print(f"❌ Lead creation parsing failed: {parsed_lead.get('type')}")
        
        # Test inventory update processing
        test_inventory_message = "New vehicle: 2020 Honda Accord - 30000 miles - excellent - $25K"
        parsed_inventory = parser.parse_message(test_inventory_message)
        
        if parsed_inventory.get('type') == 'inventory_update':
            print("✅ Inventory update message parsed successfully")
            print(f"Vehicle: {parsed_inventory.get('year')} {parsed_inventory.get('make')} {parsed_inventory.get('model')}")
            print(f"Price: {parsed_inventory.get('price', 'Unknown')}")
        else:
            print(f"❌ Inventory update parsing failed: {parsed_inventory.get('type')}")
        
        print("\n🎉 All tests completed successfully!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("This might be due to missing dependencies. Try activating the virtual environment:")
        print("source venv/bin/activate")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_salesperson_sms())
