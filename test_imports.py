#!/usr/bin/env python3

import sys
import os

# Add the project directory to Python path
sys.path.insert(0, '/home/engine/project')

try:
    print("Starting import test...")
    
    # Test basic imports
    import jwt
    print("✓ JWT imported")
    
    from flask import Flask
    print("✓ Flask imported")
    
    # Test models import
    from combat_engine.models import User, PlayerCharacter, CultivationLevel
    print("✓ Models imported")
    
    # Test API import
    from combat_engine.api import create_app
    print("✓ API imported")
    
    # Test app creation
    app = create_app()
    print("✓ App created successfully")
    
    print("\n🎉 All imports and app creation successful!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)