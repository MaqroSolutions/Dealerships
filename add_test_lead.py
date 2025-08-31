#!/usr/bin/env python3
"""
Script to add yourself as a test lead in the database
"""

import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# Import your database session
from src.maqro_backend.db.session import AsyncSessionLocal

# Load environment variables
load_dotenv()

async def add_test_lead():
    """Add yourself as a test lead"""
    
    async with AsyncSessionLocal() as session:
        try:
            # Get your phone number and name
            phone_number = input("Enter your phone number (e.g., +19146022064): ")
            name = input("Enter your name: ")
            dealership_id = input("Enter dealership ID (or press Enter for default): ").strip()
            
            if not dealership_id:
                # Use the default dealership ID from your logs
                dealership_id = "d660c7d6-99e2-4fa8-b99b-d221def53d20"
            
            # Normalize phone number
            if not phone_number.startswith('+'):
                phone_number = '+' + phone_number
            
            # Check if lead already exists
            check_query = text("SELECT id FROM leads WHERE phone = :phone")
            result = await session.execute(check_query, {"phone": phone_number})
            existing_lead = result.fetchone()
            
            if existing_lead:
                print(f"✅ Lead already exists with ID: {existing_lead.id}")
                return existing_lead.id
            
            # Insert new lead
            insert_query = text("""
                INSERT INTO leads (name, phone, dealership_id, status, car_interest, source, last_contact_at, created_at)
                VALUES (:name, :phone, :dealership_id, 'new', 'SUV', 'whatsapp', NOW(), NOW())
                RETURNING id
            """)
            
            result = await session.execute(
                insert_query,
                {
                    "name": name,
                    "phone": phone_number,
                    "dealership_id": dealership_id
                }
            )
            
            lead_id = result.fetchone().id
            await session.commit()
            
            print(f"✅ Successfully added lead:")
            print(f"   ID: {lead_id}")
            print(f"   Name: {name}")
            print(f"   Phone: {phone_number}")
            print(f"   Dealership: {dealership_id}")
            print(f"   Status: active")
            
            return lead_id
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error adding lead: {e}")
            return None

if __name__ == "__main__":
    lead_id = asyncio.run(add_test_lead())
    if lead_id:
        print(f"\n🎯 You can now test WhatsApp with this lead!")
        print(f"   Send a message to your WhatsApp number and it should work!")
