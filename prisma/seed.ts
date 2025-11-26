import { PrismaClient } from '@prisma/client';
import { EquipmentSlot, EquipmentRarity, MonsterType, DungeonDifficulty, Effect } from '../shared/src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Seed Cultivation Tiers (练气→渡劫)
  const cultivationTiers = [
    {
      name: '练气一层',
      description: '初入修行之路，感知天地灵气',
      level: 1,
      minExp: BigInt(0),
      maxHp: 100,
      maxMp: 50,
      attack: 10,
      defense: 5,
      speed: 10,
      multiplier: 1.0,
    },
    {
      name: '练气二层',
      description: '灵气在体内流转，初步掌控',
      level: 2,
      minExp: BigInt(100),
      maxHp: 120,
      maxMp: 60,
      attack: 12,
      defense: 6,
      speed: 11,
      multiplier: 1.1,
    },
    {
      name: '练气三层',
      description: '灵气运转自如，根基渐稳',
      level: 3,
      minExp: BigInt(300),
      maxHp: 140,
      maxMp: 70,
      attack: 14,
      defense: 7,
      speed: 12,
      multiplier: 1.2,
    },
    {
      name: '筑基期',
      description: '道基初成，踏入修真门槛',
      level: 4,
      minExp: BigInt(600),
      maxHp: 200,
      maxMp: 100,
      attack: 20,
      defense: 12,
      speed: 15,
      multiplier: 1.5,
    },
    {
      name: '金丹期',
      description: '金丹凝结，修为精纯',
      level: 5,
      minExp: BigInt(1500),
      maxHp: 300,
      maxMp: 200,
      attack: 35,
      defense: 25,
      speed: 20,
      multiplier: 2.0,
    },
    {
      name: '元婴期',
      description: '元婴出窍，神识大增',
      level: 6,
      minExp: BigInt(3000),
      maxHp: 500,
      maxMp: 400,
      attack: 60,
      defense: 45,
      speed: 30,
      multiplier: 3.0,
    },
    {
      name: '化神期',
      description: '化神归一，接近大道',
      level: 7,
      minExp: BigInt(6000),
      maxHp: 800,
      maxMp: 700,
      attack: 100,
      defense: 80,
      speed: 45,
      multiplier: 4.0,
    },
    {
      name: '渡劫期',
      description: '天劫将至，飞升在即',
      level: 8,
      minExp: BigInt(12000),
      maxHp: 1200,
      maxMp: 1000,
      attack: 150,
      defense: 120,
      speed: 60,
      multiplier: 5.0,
    },
  ];

  for (const tier of cultivationTiers) {
    await prisma.cultivationTier.upsert({
      where: { level: tier.level },
      update: tier,
      create: tier,
    });
  }

  // Seed Equipment Types
  const equipmentTypes = [
    { name: '剑', slot: EquipmentSlot.WEAPON, description: '锋利的剑' },
    { name: '刀', slot: EquipmentSlot.WEAPON, description: '沉重的刀' },
    { name: '法杖', slot: EquipmentSlot.WEAPON, description: '蕴含魔力的法杖' },
    { name: '头盔', slot: EquipmentSlot.HELMET, description: '保护头部' },
    { name: '胸甲', slot: EquipmentSlot.ARMOR, description: '保护身体' },
    { name: '战靴', slot: EquipmentSlot.BOOTS, description: '保护双脚' },
    { name: '护符', slot: EquipmentSlot.ACCESSORY, description: '神秘的护符' },
    { name: '戒指', slot: EquipmentSlot.RING, description: '魔法戒指' },
    { name: '项链', slot: EquipmentSlot.NECKLACE, description: '华丽的项链' },
  ];

  for (const type of equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: { name: type.name },
      update: type,
      create: type,
    });
  }

  // Get equipment type IDs
  const weaponType = await prisma.equipmentType.findUnique({ where: { name: '剑' } });
  const helmetType = await prisma.equipmentType.findUnique({ where: { name: '头盔' } });
  const armorType = await prisma.equipmentType.findUnique({ where: { name: '胸甲' } });
  const bootsType = await prisma.equipmentType.findUnique({ where: { name: '战靴' } });
  const ringType = await prisma.equipmentType.findUnique({ where: { name: '戒指' } });

  // Seed Starter Equipment
  const starterEquipment = [
    {
      name: '新手铁剑',
      typeId: weaponType!.id,
      rarity: EquipmentRarity.COMMON,
      baseAttack: 5,
      baseDefense: 0,
      baseSpeed: 0,
      baseHp: 0,
      baseMp: 0,
      critRate: 0.02,
      critDamage: 1.2,
      effects: '',
      description: '初学者使用的铁剑',
    },
    {
      name: '皮制头盔',
      typeId: helmetType!.id,
      rarity: EquipmentRarity.COMMON,
      baseAttack: 0,
      baseDefense: 3,
      baseSpeed: 0,
      baseHp: 10,
      baseMp: 0,
      critRate: 0,
      critDamage: 1,
      effects: '',
      description: '简单的皮制头盔',
    },
    {
      name: '布制胸甲',
      typeId: armorType!.id,
      rarity: EquipmentRarity.COMMON,
      baseAttack: 0,
      baseDefense: 5,
      baseSpeed: -1,
      baseHp: 20,
      baseMp: 5,
      critRate: 0,
      critDamage: 1,
      effects: '',
      description: '基础的布制胸甲',
    },
    {
      name: '麻鞋',
      typeId: bootsType!.id,
      rarity: EquipmentRarity.COMMON,
      baseAttack: 0,
      baseDefense: 1,
      baseSpeed: 2,
      baseHp: 0,
      baseMp: 0,
      critRate: 0,
      critDamage: 1,
      effects: '',
      description: '简单的麻鞋',
    },
    {
      name: '木戒指',
      typeId: ringType!.id,
      rarity: EquipmentRarity.COMMON,
      baseAttack: 1,
      baseDefense: 1,
      baseSpeed: 1,
      baseHp: 5,
      baseMp: 5,
      critRate: 0.01,
      critDamage: 1.1,
      effects: '',
      description: '简单的木制戒指',
    },
  ];

  for (const equipment of starterEquipment) {
    const existingEquipment = await prisma.equipment.findFirst({
      where: { name: equipment.name },
    });
    
    if (existingEquipment) {
      await prisma.equipment.update({
        where: { id: existingEquipment.id },
        data: equipment,
      });
    } else {
      await prisma.equipment.create({ data: equipment });
    }
  }

  // Create Loot Tables
  const lootTables = [
    { name: '新手怪物掉落', description: '新手区域怪物掉落表' },
    { name: '精英怪物掉落', description: '精英怪物掉落表' },
    { name: 'BOSS掉落', description: 'BOSS怪物掉落表' },
  ];

  for (const lootTable of lootTables) {
    const existingLootTable = await prisma.lootTable.findFirst({
      where: { name: lootTable.name },
    });
    
    if (existingLootTable) {
      await prisma.lootTable.update({
        where: { id: existingLootTable.id },
        data: lootTable,
      });
    } else {
      await prisma.lootTable.create({ data: lootTable });
    }
  }

  const normalLoot = await prisma.lootTable.findFirst({ where: { name: '新手怪物掉落' } });
  const eliteLoot = await prisma.lootTable.findFirst({ where: { name: '精英怪物掉落' } });
  const bossLoot = await prisma.lootTable.findFirst({ where: { name: 'BOSS掉落' } });

  // Seed Loot Items
  const lootItems = [
    // Normal monster loot
    { lootTableId: normalLoot!.id, gold: BigInt(10), dropRate: 0.8, minQuantity: 1, maxQuantity: 3 },
    { lootTableId: normalLoot!.id, gold: BigInt(5), spiritStones: BigInt(1), dropRate: 0.3, minQuantity: 1, maxQuantity: 2 },
    
    // Elite monster loot
    { lootTableId: eliteLoot!.id, gold: BigInt(50), dropRate: 0.9, minQuantity: 2, maxQuantity: 5 },
    { lootTableId: eliteLoot!.id, gold: BigInt(20), spiritStones: BigInt(5), dropRate: 0.5, minQuantity: 1, maxQuantity: 3 },
    
    // Boss monster loot
    { lootTableId: bossLoot!.id, gold: BigInt(200), dropRate: 0.95, minQuantity: 5, maxQuantity: 10 },
    { lootTableId: bossLoot!.id, gold: BigInt(100), spiritStones: BigInt(20), dropRate: 0.7, minQuantity: 3, maxQuantity: 7 },
  ];

  for (const lootItem of lootItems) {
    await prisma.lootItem.create({ data: lootItem });
  }

  // Seed Monsters
  const monsters = [
    {
      name: '野狼',
      type: MonsterType.NORMAL,
      level: 1,
      hp: 50,
      mp: 0,
      attack: 8,
      defense: 3,
      speed: 12,
      critRate: 0.05,
      critDamage: 1.2,
      goldReward: BigInt(15),
      expReward: BigInt(10),
      lootTableId: normalLoot!.id,
      description: '凶猛的野狼',
    },
    {
      name: '山贼',
      type: MonsterType.NORMAL,
      level: 2,
      hp: 70,
      mp: 10,
      attack: 12,
      defense: 5,
      speed: 10,
      critRate: 0.08,
      critDamage: 1.3,
      goldReward: BigInt(25),
      expReward: BigInt(20),
      lootTableId: normalLoot!.id,
      description: '凶恶的山贼',
    },
    {
      name: '精英野狼王',
      type: MonsterType.ELITE,
      level: 3,
      hp: 150,
      mp: 20,
      attack: 20,
      defense: 10,
      speed: 15,
      critRate: 0.1,
      critDamage: 1.5,
      goldReward: BigInt(80),
      expReward: BigInt(60),
      lootTableId: eliteLoot!.id,
      description: '狼群的王者',
    },
    {
      name: '山贼头目',
      type: MonsterType.ELITE,
      level: 4,
      hp: 200,
      mp: 30,
      attack: 28,
      defense: 15,
      speed: 12,
      critRate: 0.12,
      critDamage: 1.6,
      goldReward: BigInt(120),
      expReward: BigInt(90),
      lootTableId: eliteLoot!.id,
      description: '山贼的首领',
    },
    {
      name: '黑熊精',
      type: MonsterType.BOSS,
      level: 5,
      hp: 500,
      mp: 50,
      attack: 45,
      defense: 30,
      speed: 8,
      critRate: 0.15,
      critDamage: 2.0,
      goldReward: BigInt(300),
      expReward: BigInt(200),
      lootTableId: bossLoot!.id,
      description: '修炼成精的黑熊',
    },
    {
      name: '蛇妖',
      type: MonsterType.BOSS,
      level: 6,
      hp: 600,
      mp: 100,
      attack: 55,
      defense: 35,
      speed: 18,
      critRate: 0.18,
      critDamage: 2.2,
      goldReward: BigInt(450),
      expReward: BigInt(300),
      lootTableId: bossLoot!.id,
      description: '化为人形的蛇妖',
    },
  ];

  for (const monster of monsters) {
    const existingMonster = await prisma.monster.findFirst({
      where: { name: monster.name },
    });
    
    if (existingMonster) {
      await prisma.monster.update({
        where: { id: existingMonster.id },
        data: monster,
      });
    } else {
      await prisma.monster.create({ data: monster });
    }
  }

  // Seed Dungeons
  const dungeons = [
    {
      name: '新手村外',
      description: '新手村外的安全区域，适合初学者历练',
      difficulty: DungeonDifficulty.EASY,
      minLevel: 1,
      maxLevel: 3,
      goldReward: BigInt(50),
      expReward: BigInt(30),
      completionTime: 15,
      energyCost: 5,
      rewardMultiplier: 1.0,
    },
    {
      name: '黑森林',
      description: '阴暗的森林，隐藏着各种危险',
      difficulty: DungeonDifficulty.NORMAL,
      minLevel: 3,
      maxLevel: 6,
      goldReward: BigInt(150),
      expReward: BigInt(100),
      completionTime: 30,
      energyCost: 10,
      rewardMultiplier: 1.2,
    },
    {
      name: '山贼巢穴',
      description: '山贼的老巢，防守严密',
      difficulty: DungeonDifficulty.HARD,
      minLevel: 5,
      maxLevel: 8,
      goldReward: BigInt(300),
      expReward: BigInt(200),
      completionTime: 45,
      energyCost: 15,
      rewardMultiplier: 1.5,
    },
    {
      name: '妖兽山谷',
      description: '妖兽聚集的山谷，极度危险',
      difficulty: DungeonDifficulty.EXPERT,
      minLevel: 7,
      maxLevel: 10,
      goldReward: BigInt(600),
      expReward: BigInt(400),
      completionTime: 60,
      energyCost: 20,
      rewardMultiplier: 2.0,
    },
    {
      name: '修魔洞窟',
      description: '古代修魔者的洞窟，充满邪恶力量',
      difficulty: DungeonDifficulty.NIGHTMARE,
      minLevel: 10,
      goldReward: BigInt(1200),
      expReward: BigInt(800),
      completionTime: 90,
      energyCost: 30,
      rewardMultiplier: 3.0,
    },
  ];

  for (const dungeon of dungeons) {
    const existingDungeon = await prisma.dungeon.findFirst({
      where: { name: dungeon.name },
    });
    
    if (existingDungeon) {
      await prisma.dungeon.update({
        where: { id: existingDungeon.id },
        data: dungeon,
      });
    } else {
      await prisma.dungeon.create({ data: dungeon });
    }
  }

  // Get monster and dungeon IDs for relationships
  const wolf = await prisma.monster.findFirst({ where: { name: '野狼' } });
  const bandit = await prisma.monster.findFirst({ where: { name: '山贼' } });
  const wolfKing = await prisma.monster.findFirst({ where: { name: '精英野狼王' } });
  const banditLeader = await prisma.monster.findFirst({ where: { name: '山贼头目' } });
  const bear = await prisma.monster.findFirst({ where: { name: '黑熊精' } });
  const snake = await prisma.monster.findFirst({ where: { name: '蛇妖' } });

  const newbieDungeon = await prisma.dungeon.findFirst({ where: { name: '新手村外' } });
  const forestDungeon = await prisma.dungeon.findFirst({ where: { name: '黑森林' } });
  const banditDungeon = await prisma.dungeon.findFirst({ where: { name: '山贼巢穴' } });
  const valleyDungeon = await prisma.dungeon.findFirst({ where: { name: '妖兽山谷' } });
  const caveDungeon = await prisma.dungeon.findFirst({ where: { name: '修魔洞窟' } });

  // Seed Dungeon Monsters
  const dungeonMonsters = [
    // Newbie Village monsters
    { dungeonId: newbieDungeon!.id, monsterId: wolf!.id, quantity: 3, position: 1 },
    { dungeonId: newbieDungeon!.id, monsterId: bandit!.id, quantity: 2, position: 2 },
    
    // Black Forest monsters
    { dungeonId: forestDungeon!.id, monsterId: wolf!.id, quantity: 4, position: 1 },
    { dungeonId: forestDungeon!.id, monsterId: bandit!.id, quantity: 3, position: 2 },
    { dungeonId: forestDungeon!.id, monsterId: wolfKing!.id, quantity: 1, position: 3 },
    
    // Bandit Lair monsters
    { dungeonId: banditDungeon!.id, monsterId: bandit!.id, quantity: 5, position: 1 },
    { dungeonId: banditDungeon!.id, monsterId: wolfKing!.id, quantity: 2, position: 2 },
    { dungeonId: banditDungeon!.id, monsterId: banditLeader!.id, quantity: 1, position: 3 },
    
    // Monster Valley monsters
    { dungeonId: valleyDungeon!.id, monsterId: wolfKing!.id, quantity: 3, position: 1 },
    { dungeonId: valleyDungeon!.id, monsterId: banditLeader!.id, quantity: 2, position: 2 },
    { dungeonId: valleyDungeon!.id, monsterId: bear!.id, quantity: 1, position: 3 },
    
    // Demon Cave monsters
    { dungeonId: caveDungeon!.id, monsterId: banditLeader!.id, quantity: 3, position: 1 },
    { dungeonId: caveDungeon!.id, monsterId: bear!.id, quantity: 2, position: 2 },
    { dungeonId: caveDungeon!.id, monsterId: snake!.id, quantity: 1, position: 3 },
  ];

  for (const dungeonMonster of dungeonMonsters) {
    await prisma.dungeonMonster.create({ data: dungeonMonster });
  }

  // Create a sample player
  const firstTier = await prisma.cultivationTier.findFirst({ where: { level: 1 } });
  const samplePlayer = await prisma.player.upsert({
    where: { username: 'testplayer' },
    update: {},
    create: {
      username: 'testplayer',
      email: 'test@example.com',
      cultivationTierId: firstTier!.id,
      gold: BigInt(100),
      spiritStones: BigInt(10),
    },
  });

  // Add starter equipment to sample player's inventory
  const ironSword = await prisma.equipment.findFirst({ where: { name: '新手铁剑' } });
  const leatherHelmet = await prisma.equipment.findFirst({ where: { name: '皮制头盔' } });
  const clothArmor = await prisma.equipment.findFirst({ where: { name: '布制胸甲' } });

  if (ironSword && leatherHelmet && clothArmor) {
    // Check if items already exist in inventory before creating
    const existingInventory = await prisma.playerInventory.findMany({
      where: {
        playerId: samplePlayer.id,
        equipmentId: { in: [ironSword.id, leatherHelmet.id, clothArmor.id] },
      },
    });

    const existingEquipmentIds = existingInventory.map(item => item.equipmentId);

    const inventoryData = [
      { playerId: samplePlayer.id, equipmentId: ironSword.id, quantity: 1 },
      { playerId: samplePlayer.id, equipmentId: leatherHelmet.id, quantity: 1 },
      { playerId: samplePlayer.id, equipmentId: clothArmor.id, quantity: 1 },
    ].filter(item => !existingEquipmentIds.includes(item.equipmentId));

    if (inventoryData.length > 0) {
      await prisma.playerInventory.createMany({
        data: inventoryData,
      });
    }
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });