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
# Cultivation Game Core Schemas

This project defines the authoritative data model for a cultivation/xianxia game system using Prisma ORM and TypeScript. The system includes player progression, equipment, monsters, dungeons, and loot mechanics.

## 📋 Table of Contents

- [Core Concepts](#core-concepts)
- [Data Models](#data-models)
- [Relationships](#relationships)
- [Setup](#setup)
- [Seeding](#seeding)
- [Testing](#testing)
- [API Examples](#api-examples)

## 🎮 Core Concepts

### Cultivation System
The game follows a traditional xianxia cultivation progression:
- **练气一层** (Qi Refining Level 1) → **渡劫期** (Tribulation Crossing)
- 8 distinct cultivation tiers
- Each tier provides stat multipliers and unlocks new abilities
- Experience points drive progression between tiers

### Equipment System
- **7 Equipment Slots**: Weapon, Helmet, Armor, Boots, Accessory, Ring, Necklace
- **6 Rarity Tiers**: Common → Mythic
- Equipment provides base stats and special effects
- Players can own multiple items but only equip one per slot

### Combat & Dungeons
- **3 Monster Types**: Normal, Elite, Boss
- **5 Dungeon Difficulties**: Easy → Nightmare
- Progressive difficulty with appropriate rewards
- Energy system limits dungeon attempts

### Loot System
- Separate loot tables for different monster types
- Gold and Spirit Stones as currency
- Equipment drops with varying probabilities
- Reward multipliers based on dungeon difficulty

## 📊 Data Models

### Player
```typescript
interface Player {
  id: string;
  username: string;
  email?: string;
  level: number;
  experience: bigint;
  cultivationTierId: string;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
  gold: bigint;
  spiritStones: bigint;
}
```

### CultivationTier
```typescript
interface CultivationTier {
  id: string;
  name: string;
  level: number;
  minExp: bigint;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  multiplier: number;
}
```

### Equipment
```typescript
interface Equipment {
  id: string;
  name: string;
  typeId: string;
  rarity: EquipmentRarity;
  level: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseHp: number;
  baseMp: number;
  critRate: number;
  critDamage: number;
  effects: Effect[];
}
```

### Monster
```typescript
interface Monster {
  id: string;
  name: string;
  type: MonsterType;
  level: number;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
  goldReward: bigint;
  expReward: bigint;
  lootTableId?: string;
}
```

### Dungeon
```typescript
interface Dungeon {
  id: string;
  name: string;
  difficulty: DungeonDifficulty;
  minLevel: number;
  maxLevel?: number;
  goldReward: bigint;
  expReward: bigint;
  completionTime?: number;
  energyCost: number;
  rewardMultiplier: number;
}
```

## 🔗 Relationships

### Player Relationships
- **Player → CultivationTier**: Many-to-One (Each player has one cultivation tier)
- **Player → PlayerInventory**: One-to-Many (Player can own multiple equipment items)
- **Player → PlayerEquipment**: One-to-Many (Player can equip multiple items)
- **Player → PlayerDungeonProgress**: One-to-Many (Player can have progress in multiple dungeons)
- **Player → PlayerDungeonHistory**: One-to-Many (Player can complete dungeons multiple times)

### Equipment Relationships
- **Equipment → EquipmentType**: Many-to-One (Each equipment has one type)
- **Equipment → PlayerInventory**: One-to-Many (Equipment can be owned by multiple players)
- **Equipment → PlayerEquipment**: One-to-Many (Equipment can be equipped by multiple players - different instances)

### Monster Relationships
- **Monster → LootTable**: Many-to-One (Monsters can have one loot table)
- **Monster → DungeonMonster**: One-to-Many (Monsters can appear in multiple dungeons)

### Dungeon Relationships
- **Dungeon → DungeonMonster**: One-to-Many (Dungeons have multiple monsters)
- **Dungeon → PlayerDungeonProgress**: One-to-Many (Multiple players can have progress)
- **Dungeon → PlayerDungeonHistory**: One-to-Many (Multiple players can complete dungeons)

### Loot System Relationships
- **LootTable → LootItem**: One-to-Many (Loot tables contain multiple possible drops)
- **LootItem → Equipment**: Many-to-One (Loot items can reference equipment)

## 🚀 Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL or SQLite (for development)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

3. **Generate Prisma client**
   ```bash
   npm run db:generate
   ```

4. **Set up database**
   ```bash
   # For development with SQLite
   npm run db:push
   
   # For production with PostgreSQL
   npm run db:migrate
   ```

5. **Seed the database**
   ```bash
   npm run db:seed
   ```

## 🌱 Seeding

The seed script creates comprehensive reference data:

### Cultivation Tiers (8 levels)
- 练气一层 → 渡劫期
- Progressive stat increases
- Experience requirements

### Equipment Types (9 types)
- Weapons: 剑, 刀, 法杖
- Armor: 头盔, 胸甲, 战靴
- Accessories: 护符, 戒指, 项链

### Starter Equipment (5 items)
- 新手铁剑 (Common rarity)
- 皮制头盔 (Common rarity)
- 布制胸甲 (Common rarity)
- 麻鞋 (Common rarity)
- 木戒指 (Common rarity)

### Monsters (6 types)
- **Normal**: 野狼, 山贼
- **Elite**: 精英野狼王, 山贼头目
- **Boss**: 黑熊精, 蛇妖

### Dungeons (5 difficulties)
- **Easy**: 新手村外 (Level 1-3)
- **Normal**: 黑森林 (Level 3-6)
- **Hard**: 山贼巢穴 (Level 5-8)
- **Expert**: 妖兽山谷 (Level 7-10)
- **Nightmare**: 修魔洞窟 (Level 10+)

### Sample Player
- Username: `testplayer`
- Email: `test@example.com`
- Cultivation: 练气一层
- Starter equipment in inventory

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Suites

1. **Model Tests** (`tests/models.test.ts`)
   - CRUD operations for all models
   - Constraint validation
   - Relationship integrity

2. **CRUD Tests** (`tests/crud.test.ts`)
   - Create, Read, Update, Delete operations
   - Complex relationship operations
   - Data consistency checks

3. **Seeding Tests** (`tests/seeding.test.ts`)
   - Verify seed data integrity
   - Check data consistency
   - Validate enum values and constraints

### Test Coverage
- All models are tested
- All relationships are validated
- All constraints are verified
- Edge cases are covered

## 💾 API Examples

### Creating a Player
```typescript
const player = await prisma.player.create({
  data: {
    username: 'newplayer',
    email: 'player@example.com',
    cultivationTierId: 'tier-id',
    gold: BigInt(100),
    spiritStones: BigInt(10),
  },
  include: {
    cultivationTier: true,
  },
});
```

### Equipping Items
```typescript
// Add to inventory
await prisma.playerInventory.create({
  data: {
    playerId: player.id,
    equipmentId: equipment.id,
    quantity: 1,
  },
});

// Equip item
await prisma.playerEquipment.create({
  data: {
    playerId: player.id,
    equipmentId: equipment.id,
  },
});
```

### Starting a Dungeon
```typescript
// Create or update progress
await prisma.playerDungeonProgress.upsert({
  where: {
    playerId_dungeonId: {
      playerId: player.id,
      dungeonId: dungeon.id,
    },
  },
  update: {
    attempts: { increment: 1 },
  },
  create: {
    playerId: player.id,
    dungeonId: dungeon.id,
    attempts: 1,
  },
});
```

### Completing a Dungeon
```typescript
// Update progress
await prisma.playerDungeonProgress.update({
  where: {
    playerId_dungeonId: {
      playerId: player.id,
      dungeonId: dungeon.id,
    },
  },
  data: {
    progress: Math.max(progress.progress + 1, dungeon.monsters.length),
    bestTime: Math.min(progress.bestTime || Infinity, completionTime),
  },
});

// Record completion
await prisma.playerDungeonHistory.create({
  data: {
    playerId: player.id,
    dungeonId: dungeon.id,
    timeSpent: completionTime,
    stars: calculateStars(completionTime, dungeon.completionTime),
    goldEarned: dungeon.goldReward * dungeon.rewardMultiplier,
    expEarned: dungeon.expReward * dungeon.rewardMultiplier,
  },
});

// Update player rewards
await prisma.player.update({
  where: { id: player.id },
  data: {
    gold: { increment: goldEarned },
    experience: { increment: expEarned },
  },
});
```

### Monster Battle Simulation
```typescript
async function simulateBattle(player: Player, monster: Monster): Promise<BattleResult> {
  const playerDamage = calculateDamage(player.attack, monster.defense, player.critRate, player.critDamage);
  const monsterDamage = calculateDamage(monster.attack, player.defense, monster.critRate, monster.critDamage);
  
  // Simplified battle logic
  const playerHp = player.currentHp - monsterDamage;
  const success = playerHp > 0;
  
  if (success) {
    // Calculate loot
    const loot = await calculateLoot(monster.lootTableId);
    
    return {
      success: true,
      playerHp,
      playerMp: player.currentMp,
      goldEarned: monster.goldReward,
      expEarned: monster.expReward,
      itemsDropped: loot,
    };
  }
  
  return {
    success: false,
    playerHp: 0,
    playerMp: player.currentMp,
    goldEarned: BigInt(0),
    expEarned: BigInt(0),
    itemsDropped: [],
  };
}
```

## 📈 Performance Considerations

### Database Optimization
- Use indexes on frequently queried fields
- Consider database partitioning for large datasets
- Implement connection pooling for production

### Caching Strategy
- Cache frequently accessed data (cultivation tiers, equipment types)
- Implement Redis for session management
- Use CDN for static assets

### Scaling
- Consider read replicas for read-heavy operations
- Implement queue system for background processing
- Monitor database performance and optimize queries

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run db:reset       # Reset database
npm run db:studio      # Open Prisma Studio

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format code with Prettier

# Testing
npm test               # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## 📝 License

MIT License - see LICENSE file for details.
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
