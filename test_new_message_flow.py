#!/usr/bin/env python3
"""
Test script to demonstrate the new message flow system

This script shows how the new approval-based message flow works:
1. Customer messages go to RAG and generate responses
2. Responses are sent to salesperson for approval
3. Salesperson can approve (YES), reject (NO), edit (EDIT), or force send (FORCE)
"""

import asyncio
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def print_separator(title):
    """Print a separator with title"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)


def print_scenario(title, description):
    """Print a scenario description"""
    print(f"\n📋 {title}")
    print(f"   {description}")


def print_message(sender, message, timestamp=None):
    """Print a message in a chat-like format"""
    if timestamp is None:
        timestamp = datetime.now().strftime("%H:%M")
    
    print(f"\n[{timestamp}] {sender}: {message}")


def print_approval_options():
    """Print the approval options available to salesperson"""
    print("\n📱 Salesperson Approval Options:")
    print("   • Reply 'YES' to send the suggested response to the customer")
    print("   • Reply 'NO' to reject the response")
    print("   • Reply 'EDIT [instructions]' to have me regenerate the response")
    print("   • Reply 'FORCE [your message]' to send your custom message directly")
    print("\n💡 Edit Examples:")
    print("   • EDIT Make it more friendly and mention financing")
    print("   • EDIT Focus on the test drive experience")
    print("   • EDIT Include our current promotions")


async def simulate_customer_message():
    """Simulate a customer sending a message"""
    print_separator("CUSTOMER MESSAGE SIMULATION")
    
    print_scenario(
        "Customer Inquiry", 
        "A customer asks about Toyota Camry availability and pricing"
    )
    
    customer_message = "Hi, I'm looking for a Toyota Camry. Do you have any in stock? What's the price range?"
    
    print_message("Customer", customer_message)
    
    print("\n🔄 Processing customer message...")
    print("   1. ✅ Message received and phone number normalized")
    print("   2. ✅ Lead lookup/creation completed")
    print("   3. ✅ RAG system generating response...")
    
    # Simulate RAG response generation
    await asyncio.sleep(2)
    
    rag_response = """Hi! Thanks for your interest in the Toyota Camry. We currently have 3 Camry models in stock:

• 2023 Toyota Camry LE - $28,500
• 2023 Toyota Camry SE - $31,200  
• 2023 Toyota Camry XLE - $35,800

All models come with our comprehensive warranty and financing options. Would you like to schedule a test drive or get more details about any specific model?"""
    
    print(f"   4. ✅ RAG response generated:\n       {rag_response[:100]}...")
    
    return customer_message, rag_response


async def simulate_salesperson_approval(customer_message, rag_response):
    """Simulate salesperson receiving approval request"""
    print_separator("SALESPERSON APPROVAL REQUEST")
    
    print_scenario(
        "Approval Request", 
        "Salesperson receives the RAG response for approval before it's sent to customer"
    )
    
    approval_message = f"""📱 New customer message from John Doe (+1234567890):

Customer: {customer_message}

🤖 AI Suggested Reply:
{rag_response}

📋 Reply with:
• 'YES' to send this response
• 'NO' to reject it
• 'EDIT [instructions]' to have me improve it
• 'FORCE [your message]' to send your own message"""
    
    print_message("System", approval_message)
    
    print_approval_options()
    
    return approval_message


async def simulate_salesperson_responses(customer_message, rag_response):
    """Simulate different salesperson responses"""
    print_separator("SALESPERSON RESPONSE SCENARIOS")
    
    # Scenario 1: Approve (YES)
    print_scenario("Scenario 1: Approve Response", "Salesperson approves the RAG response")
    print_message("Salesperson", "YES")
    
    print("\n🔄 Processing approval...")
    print("   ✅ Response approved")
    print("   ✅ Message sent to customer")
    print("   ✅ Conversation history updated")
    print("   ✅ Approval status: approved")
    
    # Scenario 2: Reject (NO)
    print_scenario("Scenario 2: Reject Response", "Salesperson rejects the RAG response")
    print_message("Salesperson", "NO")
    
    print("\n🔄 Processing rejection...")
    print("   ✅ Response rejected")
    print("   ❌ No message sent to customer")
    print("   ✅ Approval status: rejected")
    
    # Scenario 3: Edit Request
    print_scenario("Scenario 3: Edit Request", "Salesperson requests edits to the response")
    edit_request = "EDIT Make it more friendly and mention our financing promotion with 0% APR for qualified buyers"
    print_message("Salesperson", edit_request)
    
    print("\n🔄 Processing edit request...")
    print("   🔄 Regenerating response with edit instructions as priority...")
    print("   📋 Edit requirements: friendly tone + financing promotion")
    
    # Simulate regenerated response
    await asyncio.sleep(2)
    
    edited_response = """Hi John! 😊 Thanks so much for your interest in the Toyota Camry! We're absolutely thrilled to help you find the perfect vehicle.

🎉 EXCITING NEWS: We're currently running an AMAZING financing promotion with 0% APR for qualified buyers! This could save you thousands in interest!

We have 3 beautiful Camry models in stock:

• 2023 Toyota Camry LE - $28,500
• 2023 Toyota Camry SE - $31,200  
• 2023 Toyota Camry XLE - $35,800

All models come with our comprehensive warranty and we'd love to show you around! Would you like to schedule a test drive or get more details about our financing options? We're here to make your car-buying experience absolutely amazing! 🚗✨"""
    
    print(f"   ✅ New response generated with edits prioritized:\n       {edited_response[:100]}...")
    print("   ✅ Edit requirements validated and met")
    print("   📱 New approval request sent to salesperson (includes FORCE option)")
    
    # Scenario 4: Force Send Custom Message
    print_scenario("Scenario 4: Force Send", "Salesperson sends their own custom message")
    custom_message = "FORCE Hi John! This is Sarah from ABC Motors. I'd love to personally help you with the Toyota Camry. I have a 2023 SE that just came in and it's perfect for you. Can I call you in 5 minutes to discuss?"
    print_message("Salesperson", custom_message)
    
    print("\n🔄 Processing force send...")
    print("   ✅ Custom message sent directly to customer")
    print("   ✅ Conversation history updated")
    print("   ✅ Approval status: force_sent")
    
    return edited_response, custom_message


async def simulate_final_customer_experience(customer_message, rag_response, edited_response, custom_message):
    """Simulate what the customer actually receives"""
    print_separator("CUSTOMER EXPERIENCE SUMMARY")
    
    print_scenario(
        "What Customer Actually Receives", 
        "Summary of messages sent to customer based on salesperson decisions"
    )
    
    print("\n📱 Messages sent to customer:")
    
    # Show the original customer message
    print_message("Customer", customer_message)
    
    # Show what happens with each scenario
    print("\n📋 Scenario 1 (YES): Customer receives the original RAG response")
    print_message("Dealership", rag_response)
    
    print("\n📋 Scenario 2 (NO): Customer receives nothing")
    print("   ❌ No message sent")
    
    print("\n📋 Scenario 3 (EDIT): Customer receives the edited response")
    print_message("Dealership", edited_response)
    
    print("\n📋 Scenario 4 (FORCE): Customer receives the custom message")
    print_message("Dealership", custom_message)


def print_flow_summary():
    """Print a summary of the new message flow"""
    print_separator("NEW MESSAGE FLOW SUMMARY")
    
    print("""
🔄 NEW MESSAGE FLOW PROCESS:

1. 📱 Customer sends message (SMS/WhatsApp)
2. 🤖 RAG system generates AI response
3. 👨‍💼 Response sent to assigned salesperson for approval
4. 📋 Salesperson can:
   • ✅ YES - Approve and send RAG response
   • ❌ NO - Reject (no message sent)
   • 🔄 EDIT [instructions] - Regenerate with edits as priority
   • 🚀 FORCE [message] - Send custom message directly
5. 💬 Customer receives approved/custom message
6. 📊 All interactions logged in conversation history

🎯 BENEFITS:
   • Quality control over AI responses
   • Salesperson can personalize messages
   • Maintains human touch in customer communication
   • Full audit trail of all interactions
   • Flexible response options for different situations
   • Edit requirements are prioritized and validated
   • FORCE option available at every approval step

💡 EDIT FEATURES:
   • Edit instructions take priority over original content
   • Automatic validation that edits are included
   • Retry mechanism if requirements aren't met
   • FORCE option always available for custom messages
""")


async def main():
    """Main simulation function"""
    print_separator("NEW MESSAGE FLOW SYSTEM DEMONSTRATION")
    print("This simulation shows how the new approval-based message flow works")
    
    # Simulate the complete flow
    customer_message, rag_response = await simulate_customer_message()
    
    await simulate_salesperson_approval(customer_message, rag_response)
    
    edited_response, custom_message = await simulate_salesperson_responses(customer_message, rag_response)
    
    await simulate_final_customer_experience(customer_message, rag_response, edited_response, custom_message)
    
    print_flow_summary()
    
    print("\n🎉 Simulation complete! The new message flow system is now active.")
    print("   All incoming messages will follow this approval workflow.")


if __name__ == "__main__":
    asyncio.run(main())
