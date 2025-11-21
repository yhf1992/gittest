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