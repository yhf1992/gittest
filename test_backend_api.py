#!/usr/bin/env python3

import requests
import json
import time

def test_backend():
    base_url = "http://localhost:5000"
    
    print("🧪 Testing Xianxia Combat Engine Backend")
    print("=" * 50)
    
    # Test health endpoint
    try:
        print("1. Testing health endpoint...")
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed:", response.json())
        else:
            print("❌ Health check failed:", response.status_code)
            return False
    except requests.exceptions.RequestException as e:
        print("❌ Cannot connect to backend:", e)
        print("Make sure the backend is running on port 5000")
        return False
    
    # Test cultivation levels endpoint
    try:
        print("\n2. Testing cultivation levels endpoint...")
        response = requests.get(f"{base_url}/auth/cultivation-levels", timeout=5)
        if response.status_code == 200:
            levels = response.json()
            print("✅ Cultivation levels:", levels.get('cultivation_levels', []))
        else:
            print("❌ Cultivation levels failed:", response.status_code)
    except requests.exceptions.RequestException as e:
        print("❌ Cultivation levels request failed:", e)
    
    # Test user registration
    try:
        print("\n3. Testing user registration...")
        test_user = {
            "username": "test_cultivator",
            "email": "test@xianxia.com",
            "password": "password123"
        }
        response = requests.post(f"{base_url}/auth/register", 
                               json=test_user, timeout=5)
        if response.status_code in [200, 201]:
            data = response.json()
            print("✅ Registration successful!")
            print(f"   User: {data.get('user', {}).get('username')}")
            print(f"   Cultivation Level: {data.get('user', {}).get('cultivation_level')}")
            print(f"   Character Class: {data.get('character', {}).get('character_class')}")
            
            # Test login with the registered user
            print("\n4. Testing user login...")
            login_data = {
                "username": "test_cultivator",
                "password": "password123"
            }
            response = requests.post(f"{base_url}/auth/login", 
                                   json=login_data, timeout=5)
            if response.status_code == 200:
                login_result = response.json()
                print("✅ Login successful!")
                token = login_result.get('token')
                
                # Test protected endpoint
                print("\n5. Testing protected profile endpoint...")
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(f"{base_url}/auth/profile", 
                                      headers=headers, timeout=5)
                if response.status_code == 200:
                    profile = response.json()
                    print("✅ Profile access successful!")
                    print(f"   User: {profile.get('user', {}).get('username')}")
                    print(f"   Level: {profile.get('character', {}).get('level')}")
                    print(f"   HP: {profile.get('character', {}).get('max_hp')}")
                else:
                    print("❌ Profile access failed:", response.status_code)
            else:
                print("❌ Login failed:", response.status_code)
        else:
            print("❌ Registration failed:", response.status_code)
            print("Response:", response.text)
    except requests.exceptions.RequestException as e:
        print("❌ Authentication tests failed:", e)
    
    print("\n🎉 Backend testing completed!")
    return True

if __name__ == "__main__":
    test_backend()