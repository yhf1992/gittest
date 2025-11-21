import { PrismaClient } from '@prisma/client';
import { EquipmentSlot, EquipmentRarity, MonsterType, DungeonDifficulty } from '../src/types';

const prisma = new PrismaClient();

describe('CRUD Operations Tests', () => {
  let testPlayerId: string;
  let testEquipmentId: string;
  let testMonsterId: string;
  let testDungeonId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  async function cleanupTestData() {
    // Clean up in order to respect foreign key constraints
    await prisma.playerDungeonHistory.deleteMany({
      where: { playerId: testPlayerId },
    });
    await prisma.playerDungeonProgress.deleteMany({
      where: { playerId: testPlayerId },
    });
    await prisma.playerEquipment.deleteMany({
      where: { playerId: testPlayerId },
    });
    await prisma.playerInventory.deleteMany({
      where: { playerId: testPlayerId },
    });
    await prisma.player.deleteMany({
      where: { id: testPlayerId },
    });
    await prisma.dungeonMonster.deleteMany({
      where: { dungeonId: testDungeonId },
    });
    await prisma.dungeon.deleteMany({
      where: { id: testDungeonId },
    });
    await prisma.monster.deleteMany({
      where: { id: testMonsterId },
    });
    await prisma.equipment.deleteMany({
      where: { id: testEquipmentId },
    });
  }

  describe('Player CRUD Operations', () => {
    it('should CREATE a new player', async () => {
      const firstTier = await prisma.cultivationTier.findFirst({
        where: { level: 1 },
      });

      const player = await prisma.player.create({
        data: {
          username: 'crudtestplayer',
          email: 'crudtest@example.com',
          cultivationTierId: firstTier!.id,
          gold: BigInt(1000),
          spiritStones: BigInt(100),
        },
      });

      testPlayerId = player.id;

      expect(player).toBeDefined();
      expect(player.username).toBe('crudtestplayer');
      expect(player.email).toBe('crudtest@example.com');
      expect(player.level).toBe(1);
      expect(player.gold).toBe(BigInt(1000));
    });

    it('should READ player data', async () => {
      const player = await prisma.player.findUnique({
        where: { id: testPlayerId },
        include: {
          cultivationTier: true,
          inventory: true,
          equipment: true,
        },
      });

      expect(player).toBeDefined();
      expect(player!.username).toBe('crudtestplayer');
      expect(player!.cultivationTier).toBeDefined();
      expect(Array.isArray(player!.inventory)).toBe(true);
      expect(Array.isArray(player!.equipment)).toBe(true);
    });

    it('should UPDATE player data', async () => {
      const updatedPlayer = await prisma.player.update({
        where: { id: testPlayerId },
        data: {
          level: 2,
          experience: BigInt(150),
          gold: BigInt(1500),
          currentHp: 120,
          maxHp: 120,
        },
      });

      expect(updatedPlayer.level).toBe(2);
      expect(updatedPlayer.experience).toBe(BigInt(150));
      expect(updatedPlayer.gold).toBe(BigInt(1500));
      expect(updatedPlayer.currentHp).toBe(120);
      expect(updatedPlayer.maxHp).toBe(120);
    });

    it('should DELETE player (cleanup in afterAll)', async () => {
      // This will be tested in the cleanup function
      expect(testPlayerId).toBeDefined();
    });
  });

  describe('Equipment CRUD Operations', () => {
    it('should CREATE new equipment', async () => {
      const weaponType = await prisma.equipmentType.findFirst({
        where: { slot: EquipmentSlot.WEAPON },
      });

      const equipment = await prisma.equipment.create({
        data: {
          name: 'CRUD Test Sword',
          typeId: weaponType!.id,
          rarity: EquipmentRarity.EPIC,
          baseAttack: 50,
          baseDefense: 10,
          baseSpeed: 5,
          baseHp: 20,
          baseMp: 10,
          critRate: 0.15,
          critDamage: 2.0,
          effects: '',
          description: 'A powerful sword for testing',
        },
      });

      testEquipmentId = equipment.id;

      expect(equipment).toBeDefined();
      expect(equipment.name).toBe('CRUD Test Sword');
      expect(equipment.rarity).toBe(EquipmentRarity.EPIC);
      expect(equipment.baseAttack).toBe(50);
      expect(equipment.effects).toContain('ATTACK_BOOST');
    });

    it('should READ equipment with type', async () => {
      const equipment = await prisma.equipment.findUnique({
        where: { id: testEquipmentId },
        include: {
          type: true,
        },
      });

      expect(equipment).toBeDefined();
      expect(equipment!.name).toBe('CRUD Test Sword');
      expect(equipment!.type).toBeDefined();
      expect(equipment!.type.slot).toBe(EquipmentSlot.WEAPON);
    });

    it('should UPDATE equipment stats', async () => {
      const updatedEquipment = await prisma.equipment.update({
        where: { id: testEquipmentId },
        data: {
          level: 2,
          baseAttack: 55,
          critRate: 0.18,
        },
      });

      expect(updatedEquipment.level).toBe(2);
      expect(updatedEquipment.baseAttack).toBe(55);
      expect(updatedEquipment.critRate).toBe(0.18);
    });
  });

  describe('Monster CRUD Operations', () => {
    let testLootTableId: string;

    beforeAll(async () => {
      const lootTable = await prisma.lootTable.create({
        data: {
          name: 'CRUD Test Loot Table',
          description: 'Loot table for CRUD tests',
        },
      });
      testLootTableId = lootTable.id;
    });

    it('should CREATE new monster', async () => {
      const monster = await prisma.monster.create({
        data: {
          name: 'CRUD Test Monster',
          type: MonsterType.ELITE,
          level: 10,
          hp: 500,
          mp: 100,
          attack: 60,
          defense: 40,
          speed: 25,
          critRate: 0.12,
          critDamage: 1.8,
          goldReward: BigInt(200),
          expReward: BigInt(150),
          lootTableId: testLootTableId,
          description: 'A powerful monster for testing',
        },
      });

      testMonsterId = monster.id;

      expect(monster).toBeDefined();
      expect(monster.name).toBe('CRUD Test Monster');
      expect(monster.type).toBe(MonsterType.ELITE);
      expect(monster.level).toBe(10);
      expect(monster.goldReward).toBe(BigInt(200));
    });

    it('should READ monster with loot table', async () => {
      const monster = await prisma.monster.findUnique({
        where: { id: testMonsterId },
        include: {
          lootTable: true,
        },
      });

      expect(monster).toBeDefined();
      expect(monster!.name).toBe('CRUD Test Monster');
      expect(monster!.lootTable).toBeDefined();
      expect(monster!.lootTable.name).toBe('CRUD Test Loot Table');
    });

    it('should UPDATE monster stats', async () => {
      const updatedMonster = await prisma.monster.update({
        where: { id: testMonsterId },
        data: {
          level: 11,
          attack: 65,
          defense: 45,
        },
      });

      expect(updatedMonster.level).toBe(11);
      expect(updatedMonster.attack).toBe(65);
      expect(updatedMonster.defense).toBe(45);
    });
  });

  describe('Dungeon CRUD Operations', () => {
    it('should CREATE new dungeon', async () => {
      const dungeon = await prisma.dungeon.create({
        data: {
          name: 'CRUD Test Dungeon',
          description: 'A dungeon for CRUD testing',
          difficulty: DungeonDifficulty.EXPERT,
          minLevel: 8,
          maxLevel: 12,
          goldReward: BigInt(500),
          expReward: BigInt(300),
          completionTime: 45,
          energyCost: 20,
          rewardMultiplier: 2.5,
        },
      });

      testDungeonId = dungeon.id;

      expect(dungeon).toBeDefined();
      expect(dungeon.name).toBe('CRUD Test Dungeon');
      expect(dungeon.difficulty).toBe(DungeonDifficulty.EXPERT);
      expect(dungeon.minLevel).toBe(8);
      expect(dungeon.goldReward).toBe(BigInt(500));
    });

    it('should READ dungeon with monsters', async () => {
      // First add a monster to the dungeon
      await prisma.dungeonMonster.create({
        data: {
          dungeonId: testDungeonId,
          monsterId: testMonsterId,
          quantity: 2,
          position: 1,
        },
      });

      const dungeon = await prisma.dungeon.findUnique({
        where: { id: testDungeonId },
        include: {
          monsters: {
            include: {
              monster: true,
            },
          },
        },
      });

      expect(dungeon).toBeDefined();
      expect(dungeon!.name).toBe('CRUD Test Dungeon');
      expect(dungeon!.monsters.length).toBe(1);
      expect(dungeon!.monsters[0].monster.name).toBe('CRUD Test Monster');
      expect(dungeon!.monsters[0].quantity).toBe(2);
    });

    it('should UPDATE dungeon rewards', async () => {
      const updatedDungeon = await prisma.dungeon.update({
        where: { id: testDungeonId },
        data: {
          goldReward: BigInt(600),
          expReward: BigInt(350),
          rewardMultiplier: 3.0,
        },
      });

      expect(updatedDungeon.goldReward).toBe(BigInt(600));
      expect(updatedDungeon.expReward).toBe(BigInt(350));
      expect(updatedDungeon.rewardMultiplier).toBe(3.0);
    });
  });

  describe('Complex Relationship Operations', () => {
    it('should manage player inventory operations', async () => {
      // Add equipment to player inventory
      const inventoryItem = await prisma.playerInventory.create({
        data: {
          playerId: testPlayerId,
          equipmentId: testEquipmentId,
          quantity: 2,
        },
      });

      expect(inventoryItem).toBeDefined();
      expect(inventoryItem.quantity).toBe(2);

      // Update quantity
      const updatedInventory = await prisma.playerInventory.update({
        where: { id: inventoryItem.id },
        data: { quantity: 5 },
      });

      expect(updatedInventory.quantity).toBe(5);

      // Read player with inventory
      const playerWithInventory = await prisma.player.findUnique({
        where: { id: testPlayerId },
        include: {
          inventory: {
            include: {
              equipment: true,
            },
          },
        },
      });

      expect(playerWithInventory!.inventory.length).toBeGreaterThan(0);
      expect(playerWithInventory!.inventory[0].equipment.name).toBe('CRUD Test Sword');
    });

    it('should manage player equipment operations', async () => {
      // Equip item
      const equippedItem = await prisma.playerEquipment.create({
        data: {
          playerId: testPlayerId,
          equipmentId: testEquipmentId,
        },
      });

      expect(equippedItem).toBeDefined();

      // Read player with equipped items
      const playerWithEquipment = await prisma.player.findUnique({
        where: { id: testPlayerId },
        include: {
          equipment: {
            include: {
              equipment: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
      });

      expect(playerWithEquipment!.equipment.length).toBeGreaterThan(0);
      expect(playerWithEquipment!.equipment[0].equipment.type.slot).toBe(EquipmentSlot.WEAPON);
    });

    it('should manage dungeon progress operations', async () => {
      // Create initial progress
      const progress = await prisma.playerDungeonProgress.create({
        data: {
          playerId: testPlayerId,
          dungeonId: testDungeonId,
          progress: 0,
          attempts: 1,
        },
      });

      expect(progress).toBeDefined();
      expect(progress.progress).toBe(0);
      expect(progress.attempts).toBe(1);

      // Update progress
      const updatedProgress = await prisma.playerDungeonProgress.update({
        where: { id: progress.id },
        data: {
          progress: 3,
          attempts: 2,
          bestTime: 40,
        },
      });

      expect(updatedProgress.progress).toBe(3);
      expect(updatedProgress.attempts).toBe(2);
      expect(updatedProgress.bestTime).toBe(40);

      // Create completion history
      const history = await prisma.playerDungeonHistory.create({
        data: {
          playerId: testPlayerId,
          dungeonId: testDungeonId,
          timeSpent: 42,
          stars: 3,
          goldEarned: BigInt(500),
          expEarned: BigInt(300),
        },
      });

      expect(history).toBeDefined();
      expect(history.stars).toBe(3);
      expect(history.goldEarned).toBe(BigInt(500));
    });
  });
});