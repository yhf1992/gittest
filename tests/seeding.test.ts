import { PrismaClient } from '@prisma/client';
import { EquipmentSlot, EquipmentRarity, MonsterType, DungeonDifficulty } from '../src/types';

const prisma = new PrismaClient();

describe('Database Seeding Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Cultivation Tiers Seeding', () => {
    it('should have seeded all cultivation tiers', async () => {
      const tiers = await prisma.cultivationTier.findMany({
        orderBy: { level: 'asc' },
      });

      expect(tiers.length).toBe(8); // Should have 8 tiers from 练气一层 to 渡劫期
      expect(tiers[0].name).toBe('练气一层');
      expect(tiers[tiers.length - 1].name).toBe('渡劫期');

      // Check tier progression
      for (let i = 0; i < tiers.length - 1; i++) {
        expect(tiers[i].level).toBeLessThan(tiers[i + 1].level);
        expect(tiers[i].minExp).toBeLessThanOrEqual(tiers[i + 1].minExp);
        expect(tiers[i].multiplier).toBeLessThanOrEqual(tiers[i + 1].multiplier);
      }
    });

    it('should have correct tier properties', async () => {
      const firstTier = await prisma.cultivationTier.findFirst({
        where: { level: 1 },
      });
      const lastTier = await prisma.cultivationTier.findFirst({
        where: { level: 8 },
      });

      expect(firstTier).toBeDefined();
      expect(firstTier!.name).toBe('练气一层');
      expect(firstTier!.maxHp).toBe(100);
      expect(firstTier!.multiplier).toBe(1.0);

      expect(lastTier).toBeDefined();
      expect(lastTier!.name).toBe('渡劫期');
      expect(lastTier!.maxHp).toBe(1200);
      expect(lastTier!.multiplier).toBe(5.0);
    });
  });

  describe('Equipment Types Seeding', () => {
    it('should have seeded all equipment types', async () => {
      const types = await prisma.equipmentType.findMany();

      expect(types.length).toBeGreaterThan(0);
      
      // Check that all slots are represented
      const slots = types.map(t => t.slot);
      expect(slots).toContain(EquipmentSlot.WEAPON);
      expect(slots).toContain(EquipmentSlot.HELMET);
      expect(slots).toContain(EquipmentSlot.ARMOR);
      expect(slots).toContain(EquipmentSlot.BOOTS);
    });

    it('should have weapon types', async () => {
      const weapons = await prisma.equipmentType.findMany({
        where: { slot: EquipmentSlot.WEAPON },
      });

      expect(weapons.length).toBeGreaterThan(0);
      const weaponNames = weapons.map(w => w.name);
      expect(weaponNames).toContain('剑');
      expect(weaponNames).toContain('刀');
      expect(weaponNames).toContain('法杖');
    });
  });

  describe('Starter Equipment Seeding', () => {
    it('should have seeded starter equipment', async () => {
      const starterSword = await prisma.equipment.findUnique({
        where: { name: '新手铁剑' },
      });

      expect(starterSword).toBeDefined();
      expect(starterSword!.rarity).toBe(EquipmentRarity.COMMON);
      expect(starterSword!.baseAttack).toBe(5);
      expect(starterSword!.critRate).toBe(0.02);

      const starterHelmet = await prisma.equipment.findUnique({
        where: { name: '皮制头盔' },
      });

      expect(starterHelmet).toBeDefined();
      expect(starterHelmet!.typeId).toBeDefined();
    });

    it('should have equipment with proper types', async () => {
      const equipment = await prisma.equipment.findMany({
        take: 5,
        include: {
          type: true,
        },
      });

      for (const item of equipment) {
        expect(item.type).toBeDefined();
        expect(item.type.slot).toBeDefined();
        expect(Object.values(EquipmentSlot)).toContain(item.type.slot);
      }
    });
  });

  describe('Monsters Seeding', () => {
    it('should have seeded different monster types', async () => {
      const normalMonsters = await prisma.monster.findMany({
        where: { type: MonsterType.NORMAL },
      });
      const eliteMonsters = await prisma.monster.findMany({
        where: { type: MonsterType.ELITE },
      });
      const bossMonsters = await prisma.monster.findMany({
        where: { type: MonsterType.BOSS },
      });

      expect(normalMonsters.length).toBeGreaterThan(0);
      expect(eliteMonsters.length).toBeGreaterThan(0);
      expect(bossMonsters.length).toBeGreaterThan(0);
    });

    it('should have progressive monster difficulty', async () => {
      const wolf = await prisma.monster.findUnique({
        where: { name: '野狼' },
      });
      const bear = await prisma.monster.findUnique({
        where: { name: '黑熊精' },
      });

      expect(wolf).toBeDefined();
      expect(wolf!.type).toBe(MonsterType.NORMAL);
      expect(wolf!.level).toBe(1);

      expect(bear).toBeDefined();
      expect(bear!.type).toBe(MonsterType.BOSS);
      expect(bear!.level).toBe(5);
      expect(bear!.hp).toBeGreaterThan(wolf!.hp);
      expect(bear!.attack).toBeGreaterThan(wolf!.attack);
    });

    it('should have monsters with loot tables', async () => {
      const monstersWithLoot = await prisma.monster.findMany({
        where: {
          lootTableId: {
            not: null,
          },
        },
      });

      expect(monstersWithLoot.length).toBeGreaterThan(0);

      for (const monster of monstersWithLoot) {
        const lootTable = await prisma.lootTable.findUnique({
          where: { id: monster.lootTableId! },
        });
        expect(lootTable).toBeDefined();
      }
    });
  });

  describe('Loot Tables Seeding', () => {
    it('should have seeded loot tables', async () => {
      const lootTables = await prisma.lootTable.findMany();

      expect(lootTables.length).toBe(3);
      
      const names = lootTables.map(lt => lt.name);
      expect(names).toContain('新手怪物掉落');
      expect(names).toContain('精英怪物掉落');
      expect(names).toContain('BOSS掉落');
    });

    it('should have loot items with proper drop rates', async () => {
      const lootItems = await prisma.lootItem.findMany();

      expect(lootItems.length).toBeGreaterThan(0);

      for (const item of lootItems) {
        expect(item.dropRate).toBeGreaterThanOrEqual(0);
        expect(item.dropRate).toBeLessThanOrEqual(1);
        expect(item.minQuantity).toBeGreaterThan(0);
        expect(item.maxQuantity).toBeGreaterThanOrEqual(item.minQuantity);
      }
    });
  });

  describe('Dungeons Seeding', () => {
    it('should have seeded all difficulty levels', async () => {
      const dungeons = await prisma.dungeon.findMany();

      expect(dungeons.length).toBe(5);

      const difficulties = dungeons.map(d => d.difficulty);
      expect(difficulties).toContain(DungeonDifficulty.EASY);
      expect(difficulties).toContain(DungeonDifficulty.NORMAL);
      expect(difficulties).toContain(DungeonDifficulty.HARD);
      expect(difficulties).toContain(DungeonDifficulty.EXPERT);
      expect(difficulties).toContain(DungeonDifficulty.NIGHTMARE);
    });

    it('should have progressive dungeon difficulty', async () => {
      const dungeons = await prisma.dungeon.findMany({
        orderBy: { difficulty: 'asc' },
      });

      for (let i = 0; i < dungeons.length - 1; i++) {
        const current = dungeons[i];
        const next = dungeons[i + 1];
        
        // Higher difficulty should have higher requirements and rewards
        expect(next.minLevel).toBeGreaterThanOrEqual(current.minLevel);
        expect(next.energyCost).toBeGreaterThanOrEqual(current.energyCost);
        expect(next.rewardMultiplier).toBeGreaterThanOrEqual(current.rewardMultiplier);
      }
    });

    it('should have dungeon monsters properly assigned', async () => {
      const dungeonMonsters = await prisma.dungeonMonster.findMany({
        include: {
          dungeon: true,
          monster: true,
        },
      });

      expect(dungeonMonsters.length).toBeGreaterThan(0);

      for (const dm of dungeonMonsters) {
        expect(dm.dungeon).toBeDefined();
        expect(dm.monster).toBeDefined();
        expect(dm.quantity).toBeGreaterThan(0);
        if (dm.position) {
          expect(dm.position).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Sample Player Seeding', () => {
    it('should have created sample player', async () => {
      const samplePlayer = await prisma.player.findUnique({
        where: { username: 'testplayer' },
        include: {
          cultivationTier: true,
          inventory: {
            include: {
              equipment: true,
            },
          },
        },
      });

      expect(samplePlayer).toBeDefined();
      expect(samplePlayer!.username).toBe('testplayer');
      expect(samplePlayer!.email).toBe('test@example.com');
      expect(samplePlayer!.cultivationTier).toBeDefined();
      expect(samplePlayer!.cultivationTier!.name).toBe('练气一层');
      expect(samplePlayer!.inventory.length).toBeGreaterThan(0);
    });

    it('should have starter equipment in inventory', async () => {
      const samplePlayer = await prisma.player.findUnique({
        where: { username: 'testplayer' },
        include: {
          inventory: {
            include: {
              equipment: true,
            },
          },
        },
      });

      const inventory = samplePlayer!.inventory;
      const equipmentNames = inventory.map(i => i.equipment.name);

      expect(equipmentNames).toContain('新手铁剑');
      expect(equipmentNames).toContain('皮制头盔');
      expect(equipmentNames).toContain('布制胸甲');

      // Check quantities
      for (const item of inventory) {
        expect(item.quantity).toBe(1);
      }
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain referential integrity', async () => {
      // Check all players have valid cultivation tiers
      const players = await prisma.player.findMany();
      for (const player of players) {
        const tier = await prisma.cultivationTier.findUnique({
          where: { id: player.cultivationTierId },
        });
        expect(tier).toBeDefined();
      }

      // Check all equipment has valid types
      const equipment = await prisma.equipment.findMany();
      for (const item of equipment) {
        const type = await prisma.equipmentType.findUnique({
          where: { id: item.typeId },
        });
        expect(type).toBeDefined();
      }

      // Check all inventory items have valid players and equipment
      const inventory = await prisma.playerInventory.findMany();
      for (const item of inventory) {
        const player = await prisma.player.findUnique({
          where: { id: item.playerId },
        });
        const equipment = await prisma.equipment.findUnique({
          where: { id: item.equipmentId },
        });
        expect(player).toBeDefined();
        expect(equipment).toBeDefined();
      }
    });

    it('should have valid enum values', async () => {
      // Check equipment slots
      const equipmentTypes = await prisma.equipmentType.findMany();
      for (const type of equipmentTypes) {
        expect(Object.values(EquipmentSlot)).toContain(type.slot);
      }

      // Check equipment rarities
      const equipment = await prisma.equipment.findMany();
      for (const item of equipment) {
        expect(Object.values(EquipmentRarity)).toContain(item.rarity);
      }

      // Check monster types
      const monsters = await prisma.monster.findMany();
      for (const monster of monsters) {
        expect(Object.values(MonsterType)).toContain(monster.type);
      }

      // Check dungeon difficulties
      const dungeons = await prisma.dungeon.findMany();
      for (const dungeon of dungeons) {
        expect(Object.values(DungeonDifficulty)).toContain(dungeon.difficulty);
      }
    });

    it('should have reasonable stat values', async () => {
      // Check cultivation tier progression
      const tiers = await prisma.cultivationTier.findMany({
        orderBy: { level: 'asc' },
      });

      for (const tier of tiers) {
        expect(tier.maxHp).toBeGreaterThan(0);
        expect(tier.maxMp).toBeGreaterThan(0);
        expect(tier.attack).toBeGreaterThan(0);
        expect(tier.defense).toBeGreaterThan(0);
        expect(tier.speed).toBeGreaterThan(0);
        expect(tier.multiplier).toBeGreaterThan(0);
      }

      // Check monster stats
      const monsters = await prisma.monster.findMany();
      for (const monster of monsters) {
        expect(monster.hp).toBeGreaterThan(0);
        expect(monster.mp).toBeGreaterThanOrEqual(0);
        expect(monster.attack).toBeGreaterThan(0);
        expect(monster.defense).toBeGreaterThanOrEqual(0);
        expect(monster.speed).toBeGreaterThan(0);
        expect(monster.critRate).toBeGreaterThanOrEqual(0);
        expect(monster.critRate).toBeLessThanOrEqual(1);
        expect(monster.critDamage).toBeGreaterThan(0);
        expect(monster.goldReward).toBeGreaterThanOrEqual(0);
        expect(monster.expReward).toBeGreaterThanOrEqual(0);
      }

      // Check dungeon rewards
      const dungeons = await prisma.dungeon.findMany();
      for (const dungeon of dungeons) {
        expect(dungeon.minLevel).toBeGreaterThan(0);
        expect(dungeon.goldReward).toBeGreaterThanOrEqual(0);
        expect(dungeon.expReward).toBeGreaterThanOrEqual(0);
        expect(dungeon.energyCost).toBeGreaterThan(0);
        expect(dungeon.rewardMultiplier).toBeGreaterThan(0);
      }
    });
  });
});