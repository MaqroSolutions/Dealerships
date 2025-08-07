#!/usr/bin/env python3
"""
Test script for Lead Management functionality
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_LEAD = {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john.doe@example.com",
    "car": "2023 Toyota Camry",
    "source": "Manual Entry",
    "message": "Interested in test drive"
}

def test_create_lead():
    """Test creating a new lead"""
    print("Testing lead creation...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/leads",
            json=TEST_LEAD,
            headers={"Authorization": "Bearer test-token"}  # You'll need a real token
        )
        
        if response.status_code == 200:
            print("✅ Lead creation successful")
            lead_data = response.json()
            print(f"Lead ID: {lead_data.get('lead_id')}")
            return lead_data.get('lead_id')
        else:
            print(f"❌ Lead creation failed: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"❌ Error creating lead: {e}")
        return None

def test_get_leads():
    """Test getting leads"""
    print("\nTesting lead retrieval...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/me/leads",
            headers={"Authorization": "Bearer test-token"}  # You'll need a real token
        )
        
        if response.status_code == 200:
            leads = response.json()
            print(f"✅ Retrieved {len(leads)} leads")
            for lead in leads[:3]:  # Show first 3 leads
                print(f"  - {lead.get('name')} ({lead.get('phone')})")
        else:
            print(f"❌ Lead retrieval failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error retrieving leads: {e}")

def test_search_leads():
    """Test searching leads"""
    print("\nTesting lead search...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/me/leads?search=John",
            headers={"Authorization": "Bearer test-token"}  # You'll need a real token
        )
        
        if response.status_code == 200:
            leads = response.json()
            print(f"✅ Search found {len(leads)} leads")
            for lead in leads:
                print(f"  - {lead.get('name')} ({lead.get('phone')})")
        else:
            print(f"❌ Lead search failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error searching leads: {e}")

def test_webhook_simulation():
    """Test the webhook functionality (simulation)"""
    print("\nTesting webhook simulation...")
    
    # This would be called by Vonage when a message comes in
    webhook_data = {
        'msisdn': '+1234567890',  # Customer's phone number
        'to': '+1987654321',      # Your Vonage number
        'text': 'Hi, I\'m interested in the Toyota Camry',
        'messageId': 'test-message-id',
        'message-timestamp': datetime.now().isoformat()
    }
    
    print("Webhook would receive:")
    print(json.dumps(webhook_data, indent=2))
    print("✅ Webhook simulation complete")

def main():
    """Run all tests"""
    print("🚀 Lead Management System Tests")
    print("=" * 40)
    
    # Test lead creation
    lead_id = test_create_lead()
    
    # Test lead retrieval
    test_get_leads()
    
    # Test lead search
    test_search_leads()
    
    # Test webhook simulation
    test_webhook_simulation()
    
    print("\n" + "=" * 40)
    print("✅ All tests completed!")
    print("\nTo test the webhook functionality:")
    print("1. Set up Vonage webhook URL to: https://your-domain.com/api/webhook/vonage")
    print("2. Configure Vonage to send incoming messages to this endpoint")
    print("3. Ensure your Vonage credentials are set in environment variables")

if __name__ == "__main__":
    main()
