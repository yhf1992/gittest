# Xianxia Mini-RPG

A full-stack TypeScript/JavaScript mini-RPG game inspired by Chinese cultivation novels.

## 🏗️ Project Structure

This is a monorepo with the following structure:

```
xianxia-minirpg/
├── shared/          # Shared types and utilities
├── server/          # Node.js + Express + TypeScript backend
├── client/          # Vite + React + TypeScript frontend
├── package.json     # Root package.json with workspace configuration
└── .env.example     # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd xianxia-minirpg
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Set up the database:
```bash
npm run db:generate
npm run db:migrate
```

### Development

Start both client and server in development mode:
```bash
npm run dev
```

This will start:
- Server: http://localhost:3001
- Client: http://localhost:3000

### Individual Development

Start only the server:
```bash
npm run dev:server
```

Start only the client:
```bash
npm run dev:client
```

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run tests for a specific workspace:
```bash
npm run test --workspace=server
npm run test --workspace=client
npm run test --workspace=shared
```

## 🔧 Code Quality

Lint all packages:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

## 🗄️ Database

This project uses Prisma with SQLite for development.

### Database Commands

Generate Prisma client:
```bash
npm run db:generate
```

Run migrations:
```bash
npm run db:migrate
```

Open Prisma Studio (database GUI):
```bash
npm run db:studio
```

Reset database:
```bash
npm run db:reset
```

## 📦 Build

Build all packages for production:
```bash
npm run build
```

Start production server:
```bash
npm run start --workspace=server
```

Preview production client:
```bash
npm run preview --workspace=client
```

## 🧹 Cleanup

Clean all build artifacts:
```bash
npm run clean
```

## 📁 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001
NODE_ENV=development

# Client (optional)
VITE_API_URL=http://localhost:3001
```

## 🎮 Game Features

- Character creation and progression
- Turn-based combat system
- Experience and leveling mechanics
- Equipment and inventory system
- Quest system
- Save/load functionality

## 🛠️ Tech Stack

### Server
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- SQLite
- Jest (testing)

### Client
- React 18
- TypeScript
- Vite
- React Router
- Vitest (testing)
- Testing Library

### Shared
- TypeScript types
- Common utilities
- Shared interfaces

## 📝 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

### Characters
- `GET /api/characters` - Get all characters
- `POST /api/characters` - Create new character
- `GET /api/characters/:id` - Get character by ID

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
# Combat Engine API

A modular, turn-based combat simulation system with deterministic damage formulas, elemental modifiers, and status effects. Now includes a React frontend with xianxia-themed authentication and dashboard.

## Features

### Backend
- **Turn-based Combat System**: Alternating turns between player and opponent
- **Deterministic Mechanics**: Reproducible combat results with seed-based randomization
- **Elemental System**: Fire, Water, Earth, Wind, and Neutral elements with advantage/disadvantage modifiers
- **Status Effects**:
  - Stun: Prevents next action
  - Damage over Time (DoT): Applies damage each turn
  - Defense Debuff: Reduces defense stat
  - Attack Buff: Increases attack damage
  - Heal over Time: Applies healing each turn
- **Character Classes**: Warrior, Mage, Rogue, Paladin (each with unique mechanics)
- **Combat Logging**: Step-by-step action logs for UI playback
- **Tier Progression**: Level-based stat scaling
- **Equipment System**: Procedural generation with rarity tiers and affixes
- **Loot System**: Tiered monster drops with configurable tables
- **Dungeon System**: Multi-floor runs with daily limits and rewards
- **Authentication**: JWT-based user registration and login
- **Xianxia Theme**: Cultivation levels (练气→渡劫) and themed progression

### Frontend
- **React 18 Application**: Modern React with hooks and routing
- **Authentication UI**: Login/registration with xianxia styling
- **Dashboard**: User profile, character stats, cultivation progress
- **Session Management**: Token persistence and automatic refresh
- **Xianxia Theme**: Dark mystical UI with ancient Chinese aesthetics
- **Responsive Design**: Mobile and desktop compatible

## Quick Start

### Backend Only
```bash
cd /home/engine/project
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Full Stack (Backend + Frontend)
```bash
cd /home/engine/project
./start-dev.sh
```

Then visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Installation

```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

Server starts on `http://localhost:5000`

## API Endpoints

### POST /combat/simulate

Simulate a complete combat session between a player and opponent.

**Request Body:**
```json
{
  "player": {
    "character_id": "player_1",
    "name": "Hero",
    "character_class": "warrior",
    "level": 5,
    "max_hp": 100,
    "attack": 20,
    "defense": 15,
    "speed": 10,
    "element": "fire"
  },
  "opponent": {
    "character_id": "monster_1",
    "name": "Goblin",
    "character_class": "rogue",
    "level": 3,
    "max_hp": 50,
    "attack": 15,
    "defense": 8,
    "speed": 12,
    "element": "neutral"
  },
  "seed": 12345
}
```

**Response:**
```json
{
  "combat_id": "550e8400-e29b-41d4-a716-446655440000",
  "player": {
    "character_id": "player_1",
    "name": "Hero",
    "character_class": "warrior",
    "level": 5,
    "max_hp": 100,
    "current_hp": 75,
    "attack": 20,
    "defense": 15,
    "speed": 10,
    "element": "fire",
    "status_effects": [],
    "is_alive": true
  },
  "opponent": {
    "character_id": "monster_1",
    "name": "Goblin",
    "character_class": "rogue",
    "level": 3,
    "max_hp": 50,
    "current_hp": 0,
    "attack": 15,
    "defense": 8,
    "speed": 12,
    "element": "neutral",
    "status_effects": [],
    "is_alive": false
  },
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
          "healing_done": 0,
          "status_effects_applied": [],
          "is_crit": false,
          "is_miss": false,
          "is_stun": false,
          "multi_hit_count": 1
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

### GET /combat/character-classes

Get available character classes.

**Response:**
```json
{
  "classes": ["warrior", "mage", "rogue", "paladin"]
}
```

### GET /combat/elements

Get available elements.

**Response:**
```json
{
  "elements": ["fire", "water", "earth", "wind", "neutral"]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Character Classes

### Warrior
- Strong attack and defense
- 20% chance to apply defense debuff on hit

### Mage
- Balanced stats
- 40% chance to apply DoT (3 damage/turn) on hit

### Rogue
- High speed, lower defense
- 30% chance to apply stun on hit

### Paladin
- Tank class
- 20% chance to apply attack buff to self on successful hit

## Elemental System

### Advantages
- Fire > Earth (1.5x damage)
- Water > Fire (1.5x damage)
- Earth > Water (1.5x damage)
- Wind > Water (1.5x damage)

### Weaknesses
- Fire < Wind (0.8x damage)
- Water < Earth (0.8x damage)
- Earth < Wind (0.8x damage)
- Wind < Fire (0.8x damage)

## Damage Formula

```
base_damage = (attacker_attack * multiplier - defender_defense * 0.5) * elemental_modifier * crit_multiplier
```

- Base multiplier: 1.0
- Critical hit multiplier: 2.0
- Crit chance: 15%
- Miss chance: 5%

## Status Effects

### Stun
- Duration: 1 turn (default)
- Effect: Prevents character from acting
- Applied by: Rogues

### Damage over Time (DoT)
- Default damage: 3 per turn
- Default duration: 3 turns
- Applied by: Mages

### Defense Debuff
- Default reduction: 2 defense
- Default duration: 2 turns
- Applied by: Warriors

### Attack Buff
- Default bonus: 2 attack
- Default duration: 2 turns
- Applied by: Paladins

## Running Tests

```bash
pytest tests/ -v
pytest tests/ --cov=combat_engine  # With coverage
```

## Test Coverage

- **Models**: Character creation, stat management, status effects
- **Engine**: Damage calculations, elemental modifiers, combat simulation
- **Status Effects**: Application, ticking, and removal mechanics
- **Edge Cases**: Miss/crit calculations, death handling, overheal prevention
- **Determinism**: Reproducible results with seed-based randomization
- **Tier Progression**: Level impacts on stats and combat

## Combat Mechanics

### Turn Order
- Determined by character speed stats
- Alternates between player and opponent

### Initiative
- Speed stat determines turn order in the beginning
- Small random variation (-2 to +2) applied for dynamic combat

### Multi-hit
- High-speed characters (speed > 15) have 30% chance for double hit
- Extra hits deal 50% base damage

### Combat End
- Combat ends when one character's HP reaches 0
- Maximum 50 turns per combat (prevents infinite loops)

## Example Usage

```python
from combat_engine.models import Character, CharacterClass, ElementType
from combat_engine.engine import CombatSimulator

# Create characters
player = Character(
    character_id="player_1",
    name="Hero",
    character_class=CharacterClass.WARRIOR,
    level=5,
    max_hp=100,
    current_hp=100,
    attack=20,
    defense=15,
    speed=10,
    element=ElementType.FIRE
)

opponent = Character(
    character_id="monster_1",
    name="Goblin",
    character_class=CharacterClass.ROGUE,
    level=3,
    max_hp=50,
    current_hp=50,
    attack=15,
    defense=8,
    speed=12,
    element=ElementType.NEUTRAL
)

# Simulate combat
simulator = CombatSimulator(seed=12345)
combat_log = simulator.simulate_combat(player, opponent)

# Access results
print(f"Winner: {combat_log.winner_id}")
print(f"Total turns: {combat_log.total_turns}")
for turn in combat_log.turns:
    print(f"Turn {turn.turn_number}: {turn.actor_id} acted")
```

## OpenAPI Specification

The API follows RESTful conventions with JSON request/response bodies. See `/api-schema.yaml` for full OpenAPI 3.0 specification.

## Frontend Usage

### Authentication Flow
1. **Register**: POST `/auth/register` with username, email, password
2. **Login**: POST `/auth/login` with username, password
3. **Access Protected Routes**: Include `Authorization: Bearer <token>` header
4. **Session Persistence**: Frontend stores token in localStorage

### Frontend Features
- **Xianxia Theme**: Dark mystical UI with ancient Chinese aesthetics
- **Cultivation Levels**: 练气 → 筑基 → 金丹 → 元婴 → 化神 → 渡劫
- **Character Stats**: HP, Attack, Defense, Speed display
- **Experience System**: Visual progress bars and level calculations
- **Quick Actions**: Buttons for combat, equipment, dungeons

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

Visit http://localhost:3000 for the frontend interface.

## Architecture

```
combat_engine/
├── models.py          # Data models and enums
├── engine.py          # Combat logic and formulas
├── api.py             # Flask REST API
├── equipment.py        # Equipment generation system
├── loot.py           # Loot system and tables
├── dungeon.py        # Dungeon management
└── __init__.py        # Package exports

tests/
├── test_models.py     # Model tests
├── test_engine.py     # Engine and integration tests
├── test_equipment.py  # Equipment system tests
├── test_loot.py      # Loot system tests
├── test_dungeon.py   # Dungeon system tests
└── test_integration.py # Full workflow tests

frontend/
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/        # Page components (Login, Dashboard)
│   ├── services/     # API and authentication services
│   ├── App.js        # Main React app
│   └── index.js      # Entry point
├── public/           # Static assets
├── package.json      # Frontend dependencies
└── README.md        # Frontend documentation

app.py                 # Main server entry point
start-dev.sh          # Development server script
```

## Design Decisions

1. **Deterministic by Default**: All randomness is controllable via seed for testing and replay
2. **Stat Modification**: Stats are mutable through status effects for realistic combat simulation
3. **Deep Copy for Simulation**: Original character objects are not modified during simulation
4. **Status Effect Stacking**: Longer-duration effects replace shorter-duration ones of the same type
5. **Class-based Abilities**: Each class has unique mechanics reflecting their role
