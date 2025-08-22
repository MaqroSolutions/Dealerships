#!/usr/bin/env python3
"""
Test script to verify backend imports work correctly
"""

import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test if all required modules can be imported"""
    try:
        print("Testing backend imports...")
        
        # Test basic imports
        from maqro_backend.api.routes import api_router
        print("✅ API router imported successfully")
        
        from maqro_backend.api.routes.mobile import router as mobile_router
        print("✅ Mobile routes imported successfully")
        
        from maqro_backend.crud import get_user_profile_by_user_id, update_user_profile
        print("✅ CRUD functions imported successfully")
        
        from maqro_backend.db.models import UserProfile
        print("✅ Database models imported successfully")
        
        print("\n🎉 All imports successful! Backend should start without issues.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
