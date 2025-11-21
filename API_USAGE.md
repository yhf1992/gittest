# Combat Engine API Usage Guide

## Quick Start

### 1. Start the Server

```bash
source venv/bin/activate
python app.py
```

Server runs on `http://localhost:5000`

### 2. Run Tests

```bash
source venv/bin/activate
pytest tests/ -v
```

## API Examples

### Example 1: Basic Combat Simulation

```bash
curl -X POST http://localhost:5000/combat/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "player": {
      "character_id": "player_1",
      "name": "Knight",
      "character_class": "warrior",
      "level": 5,
      "max_hp": 120,
      "attack": 22,
      "defense": 18,
      "speed": 10,
      "element": "neutral"
    },
    "opponent": {
      "character_id": "monster_1",
      "name": "Fire Dragon",
      "character_class": "mage",
      "level": 6,
      "max_hp": 80,
      "attack": 28,
      "defense": 10,
      "speed": 12,
      "element": "fire"
    },
    "seed": 12345
  }'
```

### Example 2: Get Available Classes

```bash
curl http://localhost:5000/combat/character-classes
```

Response:
```json
{
  "classes": ["warrior", "mage", "rogue", "paladin"]
}
```

### Example 3: Get Available Elements

```bash
curl http://localhost:5000/combat/elements
```

Response:
```json
{
  "elements": ["fire", "water", "earth", "wind", "neutral"]
}
```

### Example 4: Deterministic Combat (Using Same Seed)

```bash
# First simulation
curl -X POST http://localhost:5000/combat/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "player": {...},
    "opponent": {...},
    "seed": 999
  }'

# Second simulation with same seed will produce identical results
```

## Python Client Example

```python
import requests
import json

url = "http://localhost:5000/combat/simulate"

payload = {
    "player": {
        "character_id": "hero_1",
        "name": "Brave Knight",
        "character_class": "warrior",
        "level": 10,
        "max_hp": 200,
        "attack": 35,
        "defense": 25,
        "speed": 15,
        "element": "fire"
    },
    "opponent": {
        "character_id": "boss_1",
        "name": "Dark Lord",
        "character_class": "rogue",
        "level": 12,
        "max_hp": 150,
        "attack": 40,
        "defense": 15,
        "speed": 20,
        "element": "wind"
    },
    "seed": 42
}

response = requests.post(url, json=payload)
combat_log = response.json()

print(f"Combat ID: {combat_log['combat_id']}")
print(f"Winner: {combat_log['winner_id']}")
print(f"Total Turns: {combat_log['total_turns']}")

# Analyze each turn
for turn in combat_log['turns']:
    print(f"\nTurn {turn['turn_number']}:")
    print(f"  Actor: {turn['actor_id']}")
    for action in turn['actions']:
        print(f"    Action: {action['action_type']}")
        print(f"    Damage: {action['damage_dealt']}")
        if action['is_crit']:
            print(f"    CRITICAL HIT!")
        if action['is_miss']:
            print(f"    MISSED!")
        if action['status_effects_applied']:
            print(f"    Applied effects: {[e['effect_type'] for e in action['status_effects_applied']]}")
```

## Understanding Combat Results

### Combat Log Structure

```json
{
  "combat_id": "550e8400-e29b-41d4-a716-446655440000",
  "player": {
    "character_id": "player_1",
    "name": "Hero",
    "current_hp": 75,
    "is_alive": true,
    "status_effects": [
      {
        "effect_type": "dot",
        "value": 5,
        "duration": 2,
        "source_character_id": "monster_1"
      }
    ],
    ...
  },
  "opponent": { ... },
  "turns": [
    {
      "turn_number": 1,
      "actor_id": "player_1",
      "actions": [
        {
          "actor_id": "player_1",
          "target_id": "monster_1",
          "action_type": "attack",
          "damage_dealt": 28,
          "is_crit": false,
          "is_miss": false,
          "is_stun": false,
          "multi_hit_count": 1,
          "status_effects_applied": [
            {
              "effect_type": "defense_debuff",
              "value": 2,
              "duration": 2
            }
          ]
        }
      ],
      "actor_status_before": { ... },
      "actor_status_after": { ... },
      "target_status_before": { ... },
      "target_status_after": { ... }
    }
  ],
  "winner_id": "player_1",
  "total_turns": 3
}
```

### Key Fields to Track

- **combat_id**: Unique identifier for the simulation
- **winner_id**: Character ID of the winner (null for draw)
- **total_turns**: Number of turns until combat ended
- **player/opponent**: Final character state
  - `current_hp`: Final health
  - `is_alive`: Whether character survived
  - `status_effects`: Active effects at end of combat
- **turns**: Array of turn logs in chronological order
  - Each turn logs before/after state for both characters
  - **actions**: What happened during the turn
    - `damage_dealt`: Total damage (includes multi-hits)
    - `is_crit`: Critical hit indicator
    - `is_miss`: Attack missed
    - `is_stun`: Character was stunned
    - `multi_hit_count`: Number of hits (usually 1)
    - `status_effects_applied`: Effects applied this turn

## Class-Specific Behavior

### Warrior
- Basic melee combatant
- 20% chance to apply **defense debuff** on hit
- Good balance of attack and defense

### Mage
- Ranged magic user
- 40% chance to apply **DoT** (3 damage/turn for 3 turns) on hit
- Lower physical defense, higher special power

### Rogue
- Fast melee combatant
- 30% chance to apply **stun** (1 turn) on hit
- High speed, lower defense

### Paladin
- Tank/support hybrid
- 20% chance to apply **attack buff** to self on successful hit
- High defense, good healing potential

## Status Effects Details

### Stun
- Prevents character from acting next turn
- Duration: 1 turn (default)
- Removed after actor's action is prevented

### Damage over Time (DoT)
- Applies damage at start of each turn
- Default: 3 damage per turn
- Default duration: 3 turns
- Applied by: Mages

### Defense Debuff
- Reduces defense stat immediately
- Default: -2 defense
- Default duration: 2 turns
- Applied by: Warriors

### Attack Buff
- Increases attack stat immediately
- Default: +2 attack
- Default duration: 2 turns
- Applied by: Paladins

## Elemental Advantages

### Rock-Paper-Scissors Style

```
Fire    ---> Earth
Water   ---> Fire
Earth   ---> Water
Wind    ---> Water
```

- Advantage: **1.5x damage**
- Disadvantage: **0.8x damage**
- Same element or Neutral: **1.0x damage**

### Example

Fire attacker vs Earth defender: `damage * 1.5`
Fire attacker vs Wind defender: `damage * 0.8`

## Damage Calculation

Base formula:
```
base_damage = (attack * multiplier - defense * 0.5) * elemental_mod * crit_mult
```

Modifiers:
- **Crit multiplier**: 2.0x (15% chance)
- **Miss**: 5% base chance (0 damage)
- **Elemental**: 0.8x to 1.5x based on advantage
- **Multi-hit**: High speed (>15) has 30% chance for 2 hits (50% damage each)

## Testing Reproducibility

To get reproducible combat results:

1. Use the same **seed** value
2. Use the same character stats
3. Results will be deterministic

```python
# Both simulations will have identical outcomes
combat1 = requests.post(url, json={..., "seed": 12345}).json()
combat2 = requests.post(url, json={..., "seed": 12345}).json()

assert combat1['winner_id'] == combat2['winner_id']
assert combat1['total_turns'] == combat2['total_turns']
```

## Common Patterns

### Check if Attack Hit

```python
action = turn['actions'][0]
if not action['is_miss']:
    print(f"Hit for {action['damage_dealt']} damage!")
```

### Check for Critical Hit

```python
if action['is_crit']:
    print(f"CRITICAL HIT! {action['damage_dealt']} damage!")
```

### Track Status Effect Application

```python
for turn in combat_log['turns']:
    for action in turn['actions']:
        for effect in action['status_effects_applied']:
            print(f"Applied {effect['effect_type']} to {action['target_id']}")
```

### Monitor Character Health

```python
for turn in combat_log['turns']:
    print(f"Player HP: {turn['actor_status_after']['current_hp']}")
    print(f"Opponent HP: {turn['target_status_after']['current_hp']}")
```

## Error Handling

### Missing Required Fields

```bash
# Returns 400 Bad Request
curl -X POST http://localhost:5000/combat/simulate \
  -H "Content-Type: application/json" \
  -d '{"player": {"character_id": "p1"}}'
```

Response:
```json
{
  "error": "Missing required field: name"
}
```

### Invalid Enum Values

```bash
# Invalid character_class returns 400
curl -X POST http://localhost:5000/combat/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "player": {"character_class": "invalid", ...},
    ...
  }'
```

## Performance Considerations

- Simulations are fast (typically <100ms)
- Maximum 50 turns per combat (prevents infinite loops)
- No character modifications (uses deep copies)
- Seed-based RNG is deterministic and reproducible
