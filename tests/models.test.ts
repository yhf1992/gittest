import { PrismaClient } from '@prisma/client';
import { EquipmentSlot, EquipmentRarity, MonsterType, DungeonDifficulty, Effect } from '../src/types';

const prisma = new PrismaClient();

describe('Database Models Tests', () => {
  beforeAll(async () => {
    // Test database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('CultivationTier', () => {
    it('should create a cultivation tier', async () => {
      const tier = await prisma.cultivationTier.create({
        data: {
          name: 'Test Tier',
          description: 'Test description',
          level: 999,
          minExp: BigInt(1000),
          maxHp: 100,
          maxMp: 50,
          attack: 10,
          defense: 5,
          speed: 8,
          multiplier: 1.5,
        },
      });

      expect(tier).toBeDefined();
      expect(tier.name).toBe('Test Tier');
      expect(tier.level).toBe(999);
      expect(tier.multiplier).toBe(1.5);
    });

    it('should enforce unique level constraint', async () => {
      await expect(
        prisma.cultivationTier.create({
          data: {
            name: 'Duplicate Tier',
            level: 1, // This should already exist from seed
            minExp: BigInt(100),
            maxHp: 100,
            maxMp: 50,
            attack: 10,
            defense: 5,
            speed: 8,
            multiplier: 1.0,
          },
        })
      ).rejects.toThrow();
    });

    it('should retrieve cultivation tiers with players', async () => {
      const tiers = await prisma.cultivationTier.findMany({
        include: {
          players: true,
        },
      });

      expect(tiers.length).toBeGreaterThan(0);
      expect(Array.isArray(tiers[0].players)).toBe(true);
    });
  });

  describe('Equipment', () => {
    it('should create equipment with type', async () => {
      const equipmentType = await prisma.equipmentType.findFirst({
        where: { slot: EquipmentSlot.WEAPON },
      });

      expect(equipmentType).toBeDefined();

      const equipment = await prisma.equipment.create({
        data: {
          name: 'Test Sword',
          typeId: equipmentType!.id,
          rarity: EquipmentRarity.RARE,
          baseAttack: 25,
          baseDefense: 5,
          baseSpeed: 2,
          baseHp: 10,
          baseMp: 0,
          critRate: 0.1,
          critDamage: 1.5,
          effects: '',
        },
      });

      expect(equipment).toBeDefined();
      expect(equipment.name).toBe('Test Sword');
      expect(equipment.rarity).toBe(EquipmentRarity.RARE);
    });

    it('should retrieve equipment with type', async () => {
      const equipment = await prisma.equipment.findFirst({
        include: {
          type: true,
        },
      });

      expect(equipment).toBeDefined();
      expect(equipment!.type).toBeDefined();
      expect(equipment!.type.name).toBeDefined();
    });
  });

  describe('Player', () => {
    let testPlayer: any;

    it('should create a player with cultivation tier', async () => {
      const firstTier = await prisma.cultivationTier.findFirst({
        where: { level: 1 },
      });

      expect(firstTier).toBeDefined();

      testPlayer = await prisma.player.create({
        data: {
          username: 'testuser123',
          email: 'testuser123@example.com',
          cultivationTierId: firstTier!.id,
          gold: BigInt(500),
          spiritStones: BigInt(50),
        },
      });

      expect(testPlayer).toBeDefined();
      expect(testPlayer.username).toBe('testuser123');
      expect(testPlayer.level).toBe(1);
      expect(testPlayer.gold).toBe(BigInt(500));
    });

    it('should enforce unique username constraint', async () => {
      await expect(
        prisma.player.create({
          data: {
            username: 'testuser123', // Already exists
            cultivationTierId: testPlayer.cultivationTierId,
          },
        })
      ).rejects.toThrow();
    });

    it('should retrieve player with cultivation tier', async () => {
      const player = await prisma.player.findUnique({
        where: { id: testPlayer.id },
        include: {
          cultivationTier: true,
        },
      });

      expect(player).toBeDefined();
      expect(player!.cultivationTier).toBeDefined();
      expect(player!.cultivationTier.name).toBeDefined();
    });
  });

  describe('PlayerInventory', () => {
    let testPlayer: any;
    let testEquipment: any;

    beforeAll(async () => {
      testPlayer = await prisma.player.findFirst({
        where: { username: 'testplayer' },
      });

      const equipmentType = await prisma.equipmentType.findFirst();
      testEquipment = await prisma.equipment.create({
        data: {
          name: 'Test Inventory Item',
          typeId: equipmentType!.id,
          rarity: EquipmentRarity.COMMON,
          baseAttack: 5,
          baseDefense: 2,
          baseSpeed: 1,
          baseHp: 5,
          baseMp: 2,
          critRate: 0.05,
          critDamage: 1.2,
          effects: '',
        },
      });
    });

    it('should add items to player inventory', async () => {
      const inventoryItem = await prisma.playerInventory.create({
        data: {
          playerId: testPlayer!.id,
          equipmentId: testEquipment.id,
          quantity: 3,
        },
      });

      expect(inventoryItem).toBeDefined();
      expect(inventoryItem.quantity).toBe(3);
    });

    it('should enforce unique player-equipment constraint', async () => {
      await expect(
        prisma.playerInventory.create({
          data: {
            playerId: testPlayer!.id,
            equipmentId: testEquipment.id, // Already exists
            quantity: 1,
          },
        })
      ).rejects.toThrow();
    });

    it('should retrieve player inventory with equipment details', async () => {
      const inventory = await prisma.playerInventory.findMany({
        where: { playerId: testPlayer!.id },
        include: {
          equipment: {
            include: {
              type: true,
            },
          },
        },
      });

      expect(inventory.length).toBeGreaterThan(0);
      expect(inventory[0].equipment).toBeDefined();
      expect(inventory[0].equipment.type).toBeDefined();
    });
  });

  describe('Monster', () => {
    let testLootTable: any;

    beforeAll(async () => {
      testLootTable = await prisma.lootTable.create({
        data: {
          name: 'Test Loot Table',
          description: 'For testing purposes',
        },
      });
    });

    it('should create a monster with loot table', async () => {
      const monster = await prisma.monster.create({
        data: {
          name: 'Test Monster',
          type: MonsterType.NORMAL,
          level: 5,
          hp: 100,
          mp: 20,
          attack: 15,
          defense: 8,
          speed: 12,
          critRate: 0.08,
          critDamage: 1.3,
          goldReward: BigInt(50),
          expReward: BigInt(30),
          lootTableId: testLootTable.id,
          description: 'A test monster',
        },
      });

      expect(monster).toBeDefined();
      expect(monster.name).toBe('Test Monster');
      expect(monster.type).toBe(MonsterType.NORMAL);
      expect(monster.goldReward).toBe(BigInt(50));
    });

    it('should retrieve monsters with loot table', async () => {
      const monsters = await prisma.monster.findMany({
        where: { lootTableId: testLootTable.id },
        include: {
          lootTable: true,
        },
      });

      expect(monsters.length).toBeGreaterThan(0);
      expect(monsters[0].lootTable).toBeDefined();
      expect(monsters[0].lootTable.name).toBe('Test Loot Table');
    });
  });

  describe('Dungeon', () => {
    let testDungeon: any;
    let testMonsters: any[];

    beforeAll(async () => {
      testMonsters = await prisma.monster.findMany({
        take: 3,
      });
    });

    it('should create a dungeon', async () => {
      testDungeon = await prisma.dungeon.create({
        data: {
          name: 'Test Dungeon',
          description: 'A test dungeon',
          difficulty: DungeonDifficulty.NORMAL,
          minLevel: 3,
          maxLevel: 6,
          goldReward: BigInt(200),
          expReward: BigInt(100),
          completionTime: 25,
          energyCost: 12,
          rewardMultiplier: 1.3,
        },
      });

      expect(testDungeon).toBeDefined();
      expect(testDungeon.name).toBe('Test Dungeon');
      expect(testDungeon.difficulty).toBe(DungeonDifficulty.NORMAL);
    });

    it('should add monsters to dungeon', async () => {
      const dungeonMonster = await prisma.dungeonMonster.create({
        data: {
          dungeonId: testDungeon.id,
          monsterId: testMonsters[0].id,
          quantity: 2,
          position: 1,
        },
      });

      expect(dungeonMonster).toBeDefined();
      expect(dungeonMonster.quantity).toBe(2);
      expect(dungeonMonster.position).toBe(1);
    });

    it('should retrieve dungeon with monsters', async () => {
      const dungeon = await prisma.dungeon.findUnique({
        where: { id: testDungeon.id },
        include: {
          monsters: {
            include: {
              monster: true,
            },
          },
        },
      });

      expect(dungeon).toBeDefined();
      expect(dungeon!.monsters.length).toBeGreaterThan(0);
      expect(dungeon!.monsters[0].monster).toBeDefined();
    });
  });

  describe('PlayerDungeonProgress', () => {
    let testPlayer: any;
    let testDungeon: any;

    beforeAll(async () => {
      testPlayer = await prisma.player.findFirst({
        where: { username: 'testplayer' },
      });

      testDungeon = await prisma.dungeon.findFirst({
        where: { name: '新手村外' },
      });
    });

    it('should create dungeon progress for player', async () => {
      const progress = await prisma.playerDungeonProgress.create({
        data: {
          playerId: testPlayer!.id,
          dungeonId: testDungeon!.id,
          progress: 1,
          attempts: 3,
          bestTime: 18,
        },
      });

      expect(progress).toBeDefined();
      expect(progress.progress).toBe(1);
      expect(progress.attempts).toBe(3);
      expect(progress.bestTime).toBe(18);
    });

    it('should enforce unique player-dungeon constraint', async () => {
      await expect(
        prisma.playerDungeonProgress.create({
          data: {
            playerId: testPlayer!.id,
            dungeonId: testDungeon!.id, // Already exists
            progress: 0,
          },
        })
      ).rejects.toThrow();
    });

    it('should retrieve progress with player and dungeon details', async () => {
      const progress = await prisma.playerDungeonProgress.findUnique({
        where: {
          playerId_dungeonId: {
            playerId: testPlayer!.id,
            dungeonId: testDungeon!.id,
          },
        },
        include: {
          player: true,
          dungeon: true,
        },
      });

      expect(progress).toBeDefined();
      expect(progress!.player).toBeDefined();
      expect(progress!.dungeon).toBeDefined();
      expect(progress!.player.username).toBe('testplayer');
      expect(progress!.dungeon.name).toBe('新手村外');
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain referential integrity for player equipment', async () => {
      const testPlayer = await prisma.player.findFirst();
      const testEquipment = await prisma.equipment.findFirst();

      // Valid equipment should succeed
      const validEquipment = await prisma.playerEquipment.create({
        data: {
          playerId: testPlayer!.id,
          equipmentId: testEquipment!.id,
        },
      });

      expect(validEquipment).toBeDefined();

      // Invalid equipment ID should fail
      await expect(
        prisma.playerEquipment.create({
          data: {
            playerId: testPlayer!.id,
            equipmentId: 'invalid-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should cascade delete related records', async () => {
      // Create a test player with related data
      const tier = await prisma.cultivationTier.findFirst();
      const testPlayer = await prisma.player.create({
        data: {
          username: 'cascadetest',
          cultivationTierId: tier!.id,
        },
      });

      const equipment = await prisma.equipment.findFirst();
      await prisma.playerInventory.create({
        data: {
          playerId: testPlayer.id,
          equipmentId: equipment!.id,
        },
      });

      // Delete the player - should cascade delete inventory
      await prisma.player.delete({
        where: { id: testPlayer.id },
      });

      // Verify inventory is deleted
      const inventory = await prisma.playerInventory.findMany({
        where: { playerId: testPlayer.id },
      });

      expect(inventory.length).toBe(0);
    });
  });
});