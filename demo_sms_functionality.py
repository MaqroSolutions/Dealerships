#!/usr/bin/env python3
"""
Simple demonstration of the SMS functionality for salespeople
This script shows how the system parses SMS messages for lead creation and inventory updates
"""

import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def demo_sms_parsing():
    """Demonstrate SMS parsing functionality"""
    
    print("🚗 Maqro Dealership SMS Functionality Demo")
    print("=" * 50)
    print()
    print("This demo shows how salespeople can create leads and add inventory via SMS")
    print()
    
    try:
        # Import the SMS parser
        from maqro_backend.services.sms_parser import SMSParser
        
        print("✅ Successfully imported SMS parser")
        print()
        
        # Create parser instance
        parser = SMSParser()
        
        # Demo 1: Lead Creation
        print("📝 Demo 1: Lead Creation via SMS")
        print("-" * 30)
        
        lead_message = "I just met Anna Johnson. Her number is 555-123-4567 and her email is anna@gmail.com. She is interested in subarus in the price range of $10K. I met her at the dealership."
        print(f"Salesperson SMS: {lead_message}")
        print()
        
        parsed_lead = parser.parse_message(lead_message)
        print(f"✅ Parsed as: {parsed_lead.get('type', 'unknown')}")
        print(f"   Customer Name: {parsed_lead.get('name', 'Unknown')}")
        print(f"   Phone: {parsed_lead.get('phone', 'Unknown')}")
        print(f"   Email: {parsed_lead.get('email', 'Unknown')}")
        print(f"   Car Interest: {parsed_lead.get('car_interest', 'Unknown')}")
        print(f"   Price Range: {parsed_lead.get('price_range', 'Unknown')}")
        print()
        
        # Demo 2: Inventory Update
        print("🚗 Demo 2: Inventory Update via SMS")
        print("-" * 30)
        
        inventory_message = "I just picked up a 2006 Toyota Camry off facebook marketplace. It has 123456 miles. It is in good condition. Add it to the inventory"
        print(f"Salesperson SMS: {inventory_message}")
        print()
        
        parsed_inventory = parser.parse_message(inventory_message)
        print(f"✅ Parsed as: {parsed_inventory.get('type', 'unknown')}")
        print(f"   Year: {parsed_inventory.get('year', 'Unknown')}")
        print(f"   Make: {parsed_inventory.get('make', 'Unknown')}")
        print(f"   Model: {parsed_inventory.get('model', 'Unknown')}")
        print(f"   Mileage: {parsed_inventory.get('mileage', 'Unknown')}")
        print(f"   Condition: {parsed_inventory.get('condition', 'Unknown')}")
        print()
        
        # Demo 3: Alternative Formats
        print("🔄 Demo 3: Alternative Message Formats")
        print("-" * 30)
        
        alternative_messages = [
            "Met John Smith today. Phone: (555) 987-6543, Email: john@email.com. Interested in Honda Civic around $15K",
            "New inventory: 2018 Honda Civic - 45000 miles - excellent - $18K",
            "Customer Sarah wants to test drive the 2020 Toyota Camry tomorrow at 2pm. Her number is 555-1234"
        ]
        
        for i, message in enumerate(alternative_messages, 1):
            print(f"Format {i}: {message}")
            parsed = parser.parse_message(message)
            print(f"   ✅ Parsed as: {parsed.get('type', 'unknown')}")
            print()
        
        # Demo 4: What Happens Next
        print("🔄 Demo 4: What Happens After SMS is Sent")
        print("-" * 30)
        print("1. Salesperson sends SMS to the dealership number")
        print("2. System automatically identifies the sender as a salesperson")
        print("3. LLM-powered parser extracts structured data from the message")
        print("4. Data is stored in the Supabase database")
        print("5. Confirmation message is sent back to the salesperson")
        print("6. Lead is assigned to the salesperson or inventory is updated")
        print()
        
        print("🎉 Demo completed successfully!")
        print()
        print("💡 Key Benefits:")
        print("   • No need to use the app - just text!")
        print("   • Natural language processing")
        print("   • Automatic data extraction")
        print("   • Instant confirmation")
        print("   • Works from anywhere")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print()
        print("To run this demo, you need to:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Set up environment variables (see env.example)")
        print("3. Ensure the backend services are properly configured")
    except Exception as e:
        print(f"❌ Demo failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    demo_sms_parsing()
