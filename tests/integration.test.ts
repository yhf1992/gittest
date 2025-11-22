import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Connectivity', () => {
    it('should connect to database', async () => {
      expect(prisma).toBeDefined();
      // Test a simple query
      const count = await prisma.cultivationTier.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Seeded Data Verification', () => {
    it('should have seeded cultivation tiers', async () => {
      const tiers = await prisma.cultivationTier.findMany();
      expect(tiers.length).toBe(8);
      expect(tiers[0]?.name).toBe('练气一层');
      expect(tiers[tiers.length - 1]?.name).toBe('渡劫期');
    });

    it('should have seeded equipment types', async () => {
      const types = await prisma.equipmentType.findMany();
      expect(types.length).toBeGreaterThan(0);
      
      const weaponTypes = types.filter(t => t.slot === 'WEAPON');
      expect(weaponTypes.length).toBeGreaterThan(0);
    });

    it('should have seeded monsters', async () => {
      const monsters = await prisma.monster.findMany();
      expect(monsters.length).toBeGreaterThan(0);
      
      const normalMonsters = monsters.filter(m => m.type === 'NORMAL');
      const eliteMonsters = monsters.filter(m => m.type === 'ELITE');
      const bossMonsters = monsters.filter(m => m.type === 'BOSS');
      
      expect(normalMonsters.length).toBeGreaterThan(0);
      expect(eliteMonsters.length).toBeGreaterThan(0);
      expect(bossMonsters.length).toBeGreaterThan(0);
    });

    it('should have seeded dungeons', async () => {
      const dungeons = await prisma.dungeon.findMany();
      expect(dungeons.length).toBe(5);
      
      const difficulties = dungeons.map(d => d.difficulty);
      expect(difficulties).toContain('EASY');
      expect(difficulties).toContain('NORMAL');
      expect(difficulties).toContain('HARD');
      expect(difficulties).toContain('EXPERT');
      expect(difficulties).toContain('NIGHTMARE');
    });

    it('should have seeded sample player', async () => {
      const playerResult = await prisma.player.findUnique({
        where: { username: 'testplayer' },
        include: {
          cultivationTier: true,
          inventory: {
            include: {
              equipment: true,
            },
          },
        },
      },
      });

      expect(playerResult).toBeDefined();
      expect(playerResult?.username).toBe('testplayer');
      expect(playerResult?.cultivationTier.name).toBe('练气一层');
      expect(playerResult?.inventory.length).toBeGreaterThan(0);
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should create and retrieve a player', async () => {
      const firstTier = await prisma.cultivationTier.findFirst({
        where: { level: 1 },
      });

      const newPlayer = await prisma.player.create({
        data: {
          username: `integrationtest_${Date.now()}`,
          cultivationTierId: firstTier!.id,
          gold: BigInt(100),
        },
      });

      expect(newPlayer.id).toBeDefined();
      expect(newPlayer.username).toContain('integrationtest_');
      expect(newPlayer.gold).toBe(BigInt(100));

      // Retrieve player
      const retrieved = await prisma.player.findUnique({
        where: { id: newPlayer.id },
      });

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(newPlayer.id);
    });

    it('should create equipment with proper relationships', async () => {
      const weaponType = await prisma.equipmentType.findFirst({
        where: { slot: 'WEAPON' },
      });

      const newEquipment = await prisma.equipment.create({
        data: {
          name: `Integration Test Sword ${Date.now()}`,
          typeId: weaponType!.id,
          rarity: 'COMMON',
          baseAttack: 10,
          baseDefense: 2,
          effects: '',
        },
      });

      expect(newEquipment.id).toBeDefined();
      expect(newEquipment.typeId).toBe(weaponType!.id);

      // Test relationship
      const withTypeResult = await prisma.equipment.findUnique({
        where: { id: newEquipment.id },
        include: { type: true },
      });

      expect(withTypeResult?.type).toBeDefined();
      expect(withTypeResult?.type.slot).toBe('WEAPON');
    });
  });
});