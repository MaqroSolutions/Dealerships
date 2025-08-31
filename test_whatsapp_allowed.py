#!/usr/bin/env python3
"""
Test WhatsApp with different numbers to find allowed recipients
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_whatsapp_allowed():
    """Test WhatsApp with different numbers"""
    
    try:
        from src.maqro_backend.services.whatsapp_service import whatsapp_service
        
        # Test different phone numbers
        test_numbers = [
            "+8056688678",  # Your number
            "+19146022064", # Number from logs
            "+15550471363", # WhatsApp business number
        ]
        
        test_message = "🧪 Test message - checking allowed recipients"
        
        for phone in test_numbers:
            print(f"\n📱 Testing WhatsApp send to {phone}")
            
            # Send test message
            result = await whatsapp_service.send_message(phone, test_message)
            
            print(f"📊 Result: {result}")
            
            if result["success"]:
                print(f"✅ SUCCESS! {phone} is in allowed list!")
                break
            else:
                error = result.get('details', '')
                if "not in allowed list" in error:
                    print(f"❌ {phone} not in allowed list")
                else:
                    print(f"❌ Other error: {result.get('error', 'Unknown')}")
        
        print(f"\n📋 To fix this:")
        print(f"   1. Go to your WhatsApp Business App in Meta for Developers")
        print(f"   2. Find 'Phone Numbers' or 'Allowed Recipients' section")
        print(f"   3. Add your phone number to the allowed list")
        print(f"   4. Test again")
            
    except Exception as e:
        print(f"❌ Error testing WhatsApp: {e}")

if __name__ == "__main__":
    asyncio.run(test_whatsapp_allowed())
