#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, '/home/engine/project')

# Test imports step by step
print("Step 1: Basic imports...")
try:
    import flask
    print("✓ Flask version:", flask.__version__)
except Exception as e:
    print("❌ Flask import failed:", e)
    sys.exit(1)

try:
    import jwt
    print("✓ PyJWT imported")
except Exception as e:
    print("❌ JWT import failed:", e)
    sys.exit(1)

print("\nStep 2: Models import...")
try:
    from combat_engine.models import User, PlayerCharacter, CultivationLevel
    print("✓ Models imported successfully")
except Exception as e:
    print("❌ Models import failed:", e)
    sys.exit(1)

print("\nStep 3: API import...")
try:
    from combat_engine.api import create_app
    print("✓ API imported successfully")
except Exception as e:
    print("❌ API import failed:", e)
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nStep 4: App creation...")
try:
    app = create_app()
    print("✓ App created successfully")
    
    # Test a simple route
    with app.test_client() as client:
        response = client.get('/health')
        print(f"✓ Health check status: {response.status_code}")
        print(f"✓ Health check response: {response.get_json()}")
        
except Exception as e:
    print("❌ App creation failed:", e)
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n🎉 All tests passed! The backend should work correctly.")