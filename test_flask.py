#!/usr/bin/env python3

import sys
sys.path.insert(0, '/home/engine/project')

print("Testing Flask app creation...")

try:
    from combat_engine.api import create_app
    
    print("Creating app...")
    app = create_app()
    
    print("App created successfully!")
    print(f"App name: {app.name}")
    print(f"Number of routes: {len(app.url_map._rules)}")
    
    # List all routes
    print("\nAvailable routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.methods} {rule.rule}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()