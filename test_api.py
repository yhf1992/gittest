#!/usr/bin/env python3
"""Test API endpoints"""

from combat_engine.api import create_app

def test_api():
    app = create_app()
    
    with app.test_client() as client:
        # Test dungeons endpoint
        response = client.get('/dungeons')
        print(f"Dungeons endpoint - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"Found {len(data['dungeons'])} dungeons")
            
            # Test equipment generation
            response = client.post('/equipment/generate', json={
                'slot': 'weapon',
                'item_level': 10,
                'rarity': 'rare'
            })
            print(f"Equipment generation - Status: {response.status_code}")
            if response.status_code == 200:
                equipment = response.get_json()
                print(f"Generated {equipment['name']} with rarity {equipment['rarity']}")
            
            # Test loot rolling
            response = client.post('/loot/roll', json={
                'loot_table_id': 'default_tier_1'
            })
            print(f"Loot roll - Status: {response.status_code}")
            if response.status_code == 200:
                loot = response.get_json()
                print(f"Got {loot['total_drops']} items and {loot['currency_dropped']} currency")
        else:
            print("Failed to get dungeons")

if __name__ == "__main__":
    test_api()