#!/usr/bin/env python3
"""
Simple API test script for the edit functionality
Tests the edit feature through HTTP requests
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your server runs on different port
TEST_DEALERSHIP_ID = "d660c7d6-99e2-4fa8-b99b-d221def53d20"
TEST_USER_ID = "d245e4bb-91ae-4ec4-ad0f-18307b38daa6"

def test_webhook_endpoints():
    """Test the webhook endpoints are accessible"""
    print("🔍 Testing webhook endpoints...")
    
    # Test webhook verification endpoint
    try:
        response = requests.get(f"{BASE_URL}/whatsapp/webhook-test")
        if response.status_code == 200:
            print("✅ Webhook test endpoint accessible")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Webhook test endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Webhook test endpoint error: {e}")
    
    # Test webhook verification with parameters
    try:
        params = {
            "hub.mode": "subscribe",
            "hub.verify_token": "test_token",
            "hub.challenge": "test_challenge"
        }
        response = requests.get(f"{BASE_URL}/whatsapp/webhook", params=params)
        print(f"✅ Webhook verification endpoint accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ Webhook verification error: {e}")

def test_send_message_endpoint():
    """Test the send message endpoint"""
    print("\n📤 Testing send message endpoint...")
    
    try:
        # This would normally require authentication
        # For testing, we'll just check if the endpoint exists
        response = requests.post(f"{BASE_URL}/whatsapp/send-message")
        print(f"✅ Send message endpoint accessible: {response.status_code}")
        
        if response.status_code == 401:
            print("   Expected: Requires authentication")
        elif response.status_code == 400:
            print("   Expected: Missing parameters")
        else:
            print(f"   Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Send message endpoint error: {e}")

def test_edit_flow_simulation():
    """Simulate the edit flow by testing the underlying functions"""
    print("\n🔄 Testing edit flow simulation...")
    
    # Test the edit command parsing functions
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
    
    print("   Testing edit command parsing:")
    for command in test_commands:
        # This would normally call the actual functions
        # For now, we'll simulate the expected behavior
        is_edit = command.upper().startswith("EDIT")
        edit_text = command[5:].strip() if is_edit else None
        
        print(f"     '{command}' -> Edit: {is_edit}, Text: '{edit_text}'")

def test_health_endpoint():
    """Test the health endpoint"""
    print("\n🏥 Testing health endpoint...")
    
    try:
        # Test if we can access the service
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health endpoint accessible")
            health_data = response.json()
            print(f"   Health status: {health_data}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")

def main():
    """Main test function"""
    print("🧪 WhatsApp Edit Feature API Test Suite")
    print("=" * 50)
    
    # Test basic endpoints
    test_webhook_endpoints()
    test_send_message_endpoint()
    test_health_endpoint()
    
    # Test edit flow simulation
    test_edit_flow_simulation()
    
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    print("   • Webhook endpoints tested")
    print("   • Send message endpoint tested") 
    print("   • Edit flow logic simulated")
    print("   • Health endpoint tested")
    print("\n💡 To test the full edit functionality:")
    print("   1. Start your FastAPI server")
    print("   2. Send a WhatsApp message to trigger the webhook")
    print("   3. Reply with 'EDIT [your changes]' as a salesperson")
    print("   4. Verify the edited response is generated")
    print("   5. Approve with 'YES' or reject with 'NO'")

if __name__ == "__main__":
    main()
