#!/usr/bin/env python3
"""
Test script to verify the combat UI backend endpoints are working correctly.
"""

from combat_engine.api import create_app
import json


def test_monsters_endpoint():
    """Test the /monsters endpoint returns valid data."""
    app = create_app()
    with app.test_client() as client:
        response = client.get('/monsters')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'monsters' in data
        assert len(data['monsters']) > 0
        
        # Check first monster has all required fields
        monster = data['monsters'][0]
        required_fields = [
            'monster_id', 'name', 'character_class', 'level', 
            'max_hp', 'attack', 'defense', 'speed', 'element',
            'tier', 'description', 'loot_preview'
        ]
        for field in required_fields:
            assert field in monster, f"Missing field: {field}"
        
        # Check loot preview structure
        assert 'currency' in monster['loot_preview']
        assert 'items' in monster['loot_preview']
        assert 'drop_chance' in monster['loot_preview']
        
        print(f"✓ Monsters endpoint working: {len(data['monsters'])} monsters available")
        return data['monsters']


def test_combat_simulation(monsters):
    """Test combat simulation with a monster."""
    app = create_app()
    with app.test_client() as client:
        # Use first monster
        monster = monsters[0]
        
        # Create test player
        player = {
            'character_id': 'test_player',
            'name': 'Test Hero',
            'character_class': 'warrior',
            'level': 5,
            'max_hp': 120,
            'attack': 25,
            'defense': 18,
            'speed': 12,
            'element': 'fire'
        }
        
        opponent = {
            'character_id': monster['monster_id'],
            'name': monster['name'],
            'character_class': monster['character_class'],
            'level': monster['level'],
            'max_hp': monster['max_hp'],
            'attack': monster['attack'],
            'defense': monster['defense'],
            'speed': monster['speed'],
            'element': monster['element']
        }
        
        # Simulate combat
        response = client.post('/combat/simulate', 
                              json={'player': player, 'opponent': opponent, 'seed': 12345})
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'combat_id' in data
        assert 'turns' in data
        assert 'winner_id' in data
        assert 'total_turns' in data
        
        # Check turn structure
        if len(data['turns']) > 0:
            turn = data['turns'][0]
            assert 'turn_number' in turn
            assert 'actions' in turn
            assert 'actor_status_after' in turn
            assert 'target_status_after' in turn
            
            # Check action structure
            if len(turn['actions']) > 0:
                action = turn['actions'][0]
                assert 'actor_id' in action
                assert 'target_id' in action
                assert 'damage_dealt' in action
                assert 'is_crit' in action
                assert 'is_miss' in action
        
        print(f"✓ Combat simulation working: {data['total_turns']} turns, winner: {data['winner_id']}")
        return data


def test_all_monsters_combat():
    """Test combat with various monster tiers."""
    app = create_app()
    with app.test_client() as client:
        monsters_response = client.get('/monsters')
        monsters = monsters_response.get_json()['monsters']
        
        player = {
            'character_id': 'test_player',
            'name': 'Test Hero',
            'character_class': 'warrior',
            'level': 10,
            'max_hp': 200,
            'attack': 40,
            'defense': 30,
            'speed': 15,
            'element': 'fire'
        }
        
        results = []
        for monster in monsters:
            opponent = {
                'character_id': monster['monster_id'],
                'name': monster['name'],
                'character_class': monster['character_class'],
                'level': monster['level'],
                'max_hp': monster['max_hp'],
                'attack': monster['attack'],
                'defense': monster['defense'],
                'speed': monster['speed'],
                'element': monster['element']
            }
            
            response = client.post('/combat/simulate', 
                                  json={'player': player, 'opponent': opponent})
            assert response.status_code == 200
            
            data = response.get_json()
            results.append({
                'monster': monster['name'],
                'tier': monster['tier'],
                'winner': 'Player' if data['winner_id'] == 'test_player' else 'Monster',
                'turns': data['total_turns']
            })
        
        print("\n✓ Combat tested with all monsters:")
        for result in results:
            print(f"  - {result['monster']} ({result['tier']}): "
                  f"{result['winner']} won in {result['turns']} turns")
        
        return results


def main():
    """Run all tests."""
    print("Testing Combat UI Backend Endpoints\n" + "="*50)
    
    # Test monsters endpoint
    monsters = test_monsters_endpoint()
    
    # Test combat simulation
    test_combat_simulation(monsters)
    
    # Test all monsters
    test_all_monsters_combat()
    
    print("\n" + "="*50)
    print("✓ All tests passed!")


if __name__ == '__main__':
    main()
