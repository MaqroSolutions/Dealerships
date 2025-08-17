#!/usr/bin/env python3
"""
Debug script for SMS parsing to identify the "Missing required fields" issue
"""

import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def debug_sms_parsing():
    """Debug the SMS parsing to see what's happening"""
    
    print("🔍 Debugging SMS Parsing Issue")
    print("=" * 40)
    print()
    
    try:
        from maqro_backend.services.sms_parser import SMSParser
        
        print("✅ Successfully imported SMS parser")
        print()
        
        # Create parser instance
        parser = SMSParser()
        
        # Test message that should create a lead
        test_message = "I just met Anna Johnson. Her number is 555-123-4567 and her email is anna@gmail.com. She is interested in subarus in the price range of $10K. I met her at the dealership."
        
        print(f"🧪 Testing message: {test_message}")
        print()
        
        # Parse the message
        print("📝 Parsing message...")
        parsed_result = parser.parse_message(test_message)
        
        print(f"📊 Raw parsing result: {parsed_result}")
        print(f"📊 Result type: {type(parsed_result)}")
        print(f"📊 Result keys: {list(parsed_result.keys()) if isinstance(parsed_result, dict) else 'Not a dict'}")
        print()
        
        # Check the structure
        if isinstance(parsed_result, dict):
            if "data" in parsed_result:
                print("🔍 Found 'data' key - this is LLM parsing structure")
                print(f"   Data content: {parsed_result['data']}")
                print(f"   Data type: {parsed_result['data'].get('type')}")
                print(f"   Data keys: {list(parsed_result['data'].keys())}")
                
                # Check required fields for lead creation
                if parsed_result['data'].get('type') == 'lead_creation':
                    print("\n📋 Lead Creation Data Analysis:")
                    print(f"   Name: {parsed_result['data'].get('name')} (valid: {bool(parsed_result['data'].get('name') and parsed_result['data'].get('name') not in ['Unknown', 'Customer from SMS'])})")
                    print(f"   Phone: {parsed_result['data'].get('phone')} (valid: {bool(parsed_result['data'].get('phone') and parsed_result['data'].get('phone') not in ['Unknown', 'Not provided'])})")
                    print(f"   Email: {parsed_result['data'].get('email')}")
                    print(f"   Car Interest: {parsed_result['data'].get('car_interest')}")
                    print(f"   Price Range: {parsed_result['data'].get('price_range')}")
                    
            else:
                print("🔍 No 'data' key - this is fallback parsing structure")
                print(f"   Type: {parsed_result.get('type')}")
                print(f"   Keys: {list(parsed_result.keys())}")
                
                # Check required fields for lead creation
                if parsed_result.get('type') == 'lead_creation':
                    print("\n📋 Lead Creation Data Analysis:")
                    print(f"   Name: {parsed_result.get('name')} (valid: {bool(parsed_result.get('name') and parsed_result.get('name') not in ['Unknown', 'Customer from SMS'])})")
                    print(f"   Phone: {parsed_result.get('phone')} (valid: {bool(parsed_result.get('phone') and parsed_result.get('phone') not in ['Unknown', 'Not provided'])})")
                    print(f"   Email: {parsed_result.get('email')}")
                    print(f"   Car Interest: {parsed_result.get('car_interest')}")
                    print(f"   Price Range: {parsed_result.get('price_range')}")
        
        print()
        print("🎯 Next Steps:")
        print("1. Check if the parsing is returning the expected structure")
        print("2. Verify that required fields have valid values")
        print("3. Check if the LLM is working or falling back to basic parsing")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("This might be due to missing dependencies. Try activating the virtual environment:")
        print("source venv/bin/activate")
    except Exception as e:
        print(f"❌ Debug failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_sms_parsing()
