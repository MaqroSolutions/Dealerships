#!/usr/bin/env python3
"""
Check dealership name and investigate Mission Bay Auto
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

async def check_dealership_name():
    """Check dealership name and investigate Mission Bay Auto"""
    
    async with AsyncSessionLocal() as session:
        try:
            print("🔍 Investigating Dealership Name")
            print("=" * 40)
            
            # Check the specific dealership from logs
            dealership_id = "d660c7d6-99e2-4fa8-b99b-d221def53d20"
            
            dealership_query = text("""
                SELECT id, name, location, created_at 
                FROM dealerships 
                WHERE id = :dealership_id
            """)
            
            result = await session.execute(dealership_query, {"dealership_id": dealership_id})
            dealership = result.fetchone()
            
            if dealership:
                print(f"📋 Dealership Details:")
                print(f"   ID: {dealership.id}")
                print(f"   Name: {dealership.name}")
                print(f"   Location: {dealership.location}")
                print(f"   Created: {dealership.created_at}")
            else:
                print(f"❌ Dealership {dealership_id} not found")
                return
            
            # Check user settings for this dealership
            print(f"\n🔍 Checking User Settings...")
            settings_query = text("""
                SELECT us.user_id, us.setting_key, us.setting_value
                FROM user_settings us
                JOIN user_roles ur ON us.user_id = ur.user_id
                WHERE ur.dealership_id = :dealership_id
                AND us.setting_key = 'ai_dealership_name'
            """)
            
            result = await session.execute(settings_query, {"dealership_id": dealership_id})
            settings = result.fetchall()
            
            if settings:
                print(f"📋 AI Dealership Name Settings:")
                for setting in settings:
                    print(f"   User {setting.user_id}: {setting.setting_value}")
            else:
                print(f"   No AI dealership name settings found")
            
            # Check if there are any users associated with this dealership
            print(f"\n🔍 Checking Users for this Dealership...")
            users_query = text("""
                SELECT ur.user_id, up.full_name
                FROM user_roles ur
                LEFT JOIN user_profiles up ON ur.user_id = up.user_id
                WHERE ur.dealership_id = :dealership_id
            """)
            
            result = await session.execute(users_query, {"dealership_id": dealership_id})
            users = result.fetchall()
            
            if users:
                print(f"📋 Users in this Dealership:")
                for user in users:
                    print(f"   User {user.user_id}: {user.full_name}")
            else:
                print(f"   No users found for this dealership")
            
            print(f"\n🎯 Analysis:")
            print(f"   ✅ Actual dealership name: '{dealership.name}'")
            print(f"   ❓ AI response mentioned: 'Mission Bay Auto'")
            print(f"   🤔 This suggests the AI is generating a generic name")
            print(f"   💡 The AI should use the actual dealership name: '{dealership.name}'")
            
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_dealership_name())
