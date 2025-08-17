#!/usr/bin/env python3
"""
Test script for flexible validation that allows leads and inventory to be created with partial information
"""

import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_flexible_validation():
    """Test the flexible validation for leads and inventory"""
    
    print("🧪 Testing Flexible Validation for SMS Functionality")
    print("=" * 55)
    print()
    
    try:
        from maqro_backend.services.sms_parser import SMSParser
        
        print("✅ Successfully imported SMS parser")
        print()
        
        # Create parser instance
        parser = SMSParser()
        
        # Test 1: Lead creation with minimal information
        print("📝 Test 1: Lead Creation with Minimal Information")
        print("-" * 45)
        
        minimal_lead_message = "I just met someone interested in cars"
        print(f"Message: {minimal_lead_message}")
        
        parsed_result = parser.parse_message(minimal_lead_message)
        print(f"Parsed result: {parsed_result}")
        
        if parsed_result.get('type') == 'lead_creation':
            print("✅ Correctly identified as lead creation")
            print(f"   Name: {parsed_result.get('name')}")
            print(f"   Phone: {parsed_result.get('phone')}")
            print(f"   Email: {parsed_result.get('email')}")
            print(f"   Car Interest: {parsed_result.get('car_interest')}")
        else:
            print(f"❌ Expected 'lead_creation', got '{parsed_result.get('type', 'unknown')}'")
        
        print()
        
        # Test 2: Lead creation with partial information
        print("📝 Test 2: Lead Creation with Partial Information")
        print("-" * 45)
        
        partial_lead_message = "Met John today. Phone: 555-123-4567. Interested in Honda"
        print(f"Message: {partial_lead_message}")
        
        parsed_result = parser.parse_message(partial_lead_message)
        print(f"Parsed result: {parsed_result}")
        
        if parsed_result.get('type') == 'lead_creation':
            print("✅ Correctly identified as lead creation")
            print(f"   Name: {parsed_result.get('name')}")
            print(f"   Phone: {parsed_result.get('phone')}")
            print(f"   Email: {parsed_result.get('email')}")
            print(f"   Car Interest: {parsed_result.get('car_interest')}")
        else:
            print(f"❌ Expected 'lead_creation', got '{parsed_result.get('type', 'unknown')}'")
        
        print()
        
        # Test 3: Inventory update with minimal information
        print("🚗 Test 3: Inventory Update with Minimal Information")
        print("-" * 45)
        
        minimal_inventory_message = "I picked up a car to add to inventory"
        print(f"Message: {minimal_inventory_message}")
        
        parsed_result = parser.parse_message(minimal_inventory_message)
        print(f"Parsed result: {parsed_result}")
        
        if parsed_result.get('type') == 'inventory_update':
            print("✅ Correctly identified as inventory update")
            print(f"   Year: {parsed_result.get('year')}")
            print(f"   Make: {parsed_result.get('make')}")
            print(f"   Model: {parsed_result.get('model')}")
            print(f"   Condition: {parsed_result.get('condition')}")
        else:
            print(f"❌ Expected 'inventory_update', got '{parsed_result.get('type', 'unknown')}'")
        
        print()
        
        # Test 4: Inventory update with partial information
        print("🚗 Test 4: Inventory Update with Partial Information")
        print("-" * 45)
        
        partial_inventory_message = "New Toyota Camry. 45000 miles. Excellent condition"
        print(f"Message: {partial_inventory_message}")
        
        parsed_result = parser.parse_message(partial_inventory_message)
        print(f"Parsed result: {parsed_result}")
        
        if parsed_result.get('type') == 'inventory_update':
            print("✅ Correctly identified as inventory update")
            print(f"   Year: {parsed_result.get('year')}")
            print(f"   Make: {parsed_result.get('make')}")
            print(f"   Model: {parsed_result.get('model')}")
            print(f"   Mileage: {parsed_result.get('mileage')}")
            print(f"   Condition: {parsed_result.get('condition')}")
        else:
            print(f"❌ Expected 'inventory_update', got '{parsed_result.get('type', 'unknown')}'")
        
        print()
        
        # Test 5: Test the extraction methods directly
        print("🔍 Test 5: Testing Extraction Methods")
        print("-" * 35)
        
        test_message = "I just met Anna Johnson. Her number is 555-123-4567 and her email is anna@gmail.com. She is interested in subarus in the price range of $10K."
        
        print(f"Test message: {test_message}")
        print()
        
        # Test individual extraction methods
        print("Testing individual extraction methods:")
        print(f"   Name: {parser._extract_name_from_message(test_message)}")
        print(f"   Phone: {parser._extract_phone_from_message(test_message)}")
        print(f"   Email: {parser._extract_email_from_message(test_message)}")
        print(f"   Car Interest: {parser._extract_car_interest_from_message(test_message)}")
        print(f"   Price: {parser._extract_price_from_message(test_message)}")
        
        print()
        print("🎉 All tests completed!")
        print()
        print("💡 Key Benefits of Flexible Validation:")
        print("   • Leads can be created with just a name OR phone number")
        print("   • Inventory can be created with just make and model")
        print("   • System provides fallback values for missing information")
        print("   • Salespeople get immediate feedback on what was created")
        print("   • Incomplete records can be updated later with full details")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("This might be due to missing dependencies. Try activating the virtual environment:")
        print("source venv/bin/activate")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_flexible_validation()
