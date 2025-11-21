import { PrismaClient, EquipmentRarity, MonsterType, DungeonDifficulty } from '@prisma/client';
import { Effect } from '../src/types';

const prisma = new PrismaClient();

// Utility functions for common game operations
export class GameUtils {
  // Player utilities
  static async createPlayer(username: string, email?: string) {
    const firstTier = await prisma.cultivationTier.findFirst({
      where: { level: 1 },
    });

    if (!firstTier) {
      throw new Error('Cultivation tiers not seeded');
    }

    return await prisma.player.create({
      data: {
        username,
        email,
        cultivationTierId: firstTier.id,
        gold: BigInt(100),
        spiritStones: BigInt(10),
      },
      include: {
        cultivationTier: true,
      },
    });
  }

  static async getPlayerStats(playerId: string) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        cultivationTier: true,
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

    if (!player) {
      throw new Error('Player not found');
    }

    // Calculate total stats from equipment
    const equipmentStats = player.equipment.reduce(
      (acc, equipped) => {
        const item = equipped.equipment;
        return {
          attack: acc.attack + item.baseAttack,
          defense: acc.defense + item.baseDefense,
          speed: acc.speed + item.baseSpeed,
          hp: acc.hp + item.baseHp,
          mp: acc.mp + item.baseMp,
          critRate: acc.critRate + item.critRate,
          critDamage: acc.critDamage + item.critDamage,
        };
      },
      {
        attack: 0,
        defense: 0,
        speed: 0,
        hp: 0,
        mp: 0,
        critRate: 0,
        critDamage: 0,
      }
    );

    // Apply cultivation tier multiplier
    const multiplier = player.cultivationTier.multiplier;

    return {
      baseStats: {
        attack: player.attack * multiplier,
        defense: player.defense * multiplier,
        speed: player.speed * multiplier,
        maxHp: player.maxHp * multiplier,
        maxMp: player.maxMp * multiplier,
        critRate: player.critRate,
        critDamage: player.critDamage,
      },
      equipmentStats,
      totalStats: {
        attack: (player.attack + equipmentStats.attack) * multiplier,
        defense: (player.defense + equipmentStats.defense) * multiplier,
        speed: (player.speed + equipmentStats.speed) * multiplier,
        maxHp: (player.maxHp + equipmentStats.hp) * multiplier,
        maxMp: (player.maxMp + equipmentStats.mp) * multiplier,
        critRate: Math.min(1, player.critRate + equipmentStats.critRate),
        critDamage: player.critDamage + equipmentStats.critDamage,
      },
      current: {
        hp: player.currentHp,
        mp: player.currentMp,
        level: player.level,
        experience: player.experience,
        gold: player.gold,
        spiritStones: player.spiritStones,
      },
      cultivationTier: player.cultivationTier,
    };
  }

  static async levelUpPlayer(playerId: string) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { cultivationTier: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Check if player can level up within current tier
    const nextTier = await prisma.cultivationTier.findFirst({
      where: { level: player.cultivationTier.level + 1 },
    });

    if (!nextTier) {
      throw new Error('Already at max cultivation tier');
    }

    // Update player to next cultivation tier
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        cultivationTierId: nextTier.id,
        level: nextTier.level,
        currentHp: nextTier.maxHp,
        maxHp: nextTier.maxHp,
        currentMp: nextTier.maxMp,
        maxMp: nextTier.maxMp,
        attack: nextTier.attack,
        defense: nextTier.defense,
        speed: nextTier.speed,
      },
      include: {
        cultivationTier: true,
      },
    });

    return updatedPlayer;
  }

  // Equipment utilities
  static async equipItem(playerId: string, equipmentId: string) {
    // Check if player owns the item
    const inventoryItem = await prisma.playerInventory.findUnique({
      where: {
        playerId_equipmentId: {
          playerId,
          equipmentId,
        },
      },
      include: {
        equipment: {
          include: {
            type: true,
          },
        },
      },
    });

    if (!inventoryItem) {
      throw new Error('Item not found in inventory');
    }

    // Check if player already has an item in this slot
    const existingEquipment = await prisma.playerEquipment.findFirst({
      where: {
        playerId,
        equipment: {
          type: {
            slot: inventoryItem.equipment.type.slot,
          },
        },
      },
      include: {
        equipment: {
          include: {
            type: true,
          },
        },
      },
    });

    if (existingEquipment) {
      // Unequip current item
      await prisma.playerEquipment.delete({
        where: { id: existingEquipment.id },
      });

      // Add back to inventory
      await prisma.playerInventory.upsert({
        where: {
          playerId_equipmentId: {
            playerId,
            equipmentId: existingEquipment.equipmentId,
          },
        },
        update: {
          quantity: { increment: 1 },
        },
        create: {
          playerId,
          equipmentId: existingEquipment.equipmentId,
          quantity: 1,
        },
      });
    }

    // Equip new item
    const equippedItem = await prisma.playerEquipment.create({
      data: {
        playerId,
        equipmentId,
      },
      include: {
        equipment: {
          include: {
            type: true,
          },
        },
      },
    });

    // Remove from inventory
    if (inventoryItem.quantity === 1) {
      await prisma.playerInventory.delete({
        where: { id: inventoryItem.id },
      });
    } else {
      await prisma.playerInventory.update({
        where: { id: inventoryItem.id },
        data: { quantity: { decrement: 1 } },
      });
    }

    return equippedItem;
  }

  // Battle utilities
  static calculateDamage(
    attackerAttack: number,
    defenderDefense: number,
    critRate: number,
    critDamage: number
  ): number {
    const isCrit = Math.random() < critRate;
    const baseDamage = Math.max(1, attackerAttack - defenderDefense / 2);
    const finalDamage = isCrit ? baseDamage * critDamage : baseDamage;
    return Math.round(finalDamage);
  }

  static async simulateBattle(playerId: string, monsterId: string) {
    const playerStats = await this.getPlayerStats(playerId);
    const monster = await prisma.monster.findUnique({
      where: { id: monsterId },
      include: { lootTable: true },
    });

    if (!monster) {
      throw new Error('Monster not found');
    }

    let playerHp = playerStats.current.hp;
    let monsterHp = monster.hp;
    const playerDamage = this.calculateDamage(
      playerStats.totalStats.attack,
      monster.defense,
      playerStats.totalStats.critRate,
      playerStats.totalStats.critDamage
    );
    const monsterDamage = this.calculateDamage(
      monster.attack,
      playerStats.totalStats.defense,
      monster.critRate,
      monster.critDamage
    );

    // Simplified battle simulation
    while (playerHp > 0 && monsterHp > 0) {
      monsterHp -= playerDamage;
      if (monsterHp > 0) {
        playerHp -= monsterDamage;
      }
    }

    const success = playerHp > 0;

    if (success) {
      // Calculate loot
      const loot = await this.calculateLoot(monster.lootTableId);
      
      // Update player
      await prisma.player.update({
        where: { id: playerId },
        data: {
          currentHp: Math.max(0, playerHp),
          experience: { increment: monster.expReward },
          gold: { increment: monster.goldReward },
        },
      });

      return {
        success: true,
        playerHp,
        playerMp: playerStats.current.mp,
        goldEarned: monster.goldReward,
        expEarned: monster.expReward,
        itemsDropped: loot,
      };
    } else {
      // Player defeated
      await prisma.player.update({
        where: { id: playerId },
        data: {
          currentHp: 0,
          currentMp: 0,
        },
      });

      return {
        success: false,
        playerHp: 0,
        playerMp: 0,
        goldEarned: BigInt(0),
        expEarned: BigInt(0),
        itemsDropped: [],
      };
    }
  }

  static async calculateLoot(lootTableId?: string) {
    if (!lootTableId) {
      return [];
    }

    const lootTable = await prisma.lootTable.findUnique({
      where: { id: lootTableId },
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
      },
    });

    if (!lootTable) {
      return [];
    }

    const droppedItems: any[] = [];

    for (const lootItem of lootTable.items) {
      if (Math.random() < lootItem.dropRate) {
        const quantity = Math.floor(
          Math.random() * (lootItem.maxQuantity - lootItem.minQuantity + 1)
        ) + lootItem.minQuantity;

        if (lootItem.equipment) {
          droppedItems.push({
            type: 'equipment',
            item: lootItem.equipment,
            quantity,
          });
        } else if (lootItem.gold) {
          droppedItems.push({
            type: 'gold',
            amount: lootItem.gold * BigInt(quantity),
          });
        } else if (lootItem.spiritStones) {
          droppedItems.push({
            type: 'spiritStones',
            amount: lootItem.spiritStones * BigInt(quantity),
          });
        }
      }
    }

    return droppedItems;
  }

  // Dungeon utilities
  static async startDungeon(playerId: string, dungeonId: string) {
    const dungeon = await prisma.dungeon.findUnique({
      where: { id: dungeonId },
      include: {
        monsters: {
          include: {
            monster: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!dungeon) {
      throw new Error('Dungeon not found');
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    if (player.level < dungeon.minLevel) {
      throw new Error('Player level too low for this dungeon');
    }

    if (dungeon.maxLevel && player.level > dungeon.maxLevel) {
      throw new Error('Player level too high for this dungeon');
    }

    // Check energy
    if (player.spiritStones < BigInt(dungeon.energyCost)) {
      throw new Error('Insufficient energy');
    }

    // Deduct energy
    await prisma.player.update({
      where: { id: playerId },
      data: {
        spiritStones: { decrement: BigInt(dungeon.energyCost) },
      },
    });

    // Update or create progress
    const progress = await prisma.playerDungeonProgress.upsert({
      where: {
        playerId_dungeonId: {
          playerId,
          dungeonId,
        },
      },
      update: {
        attempts: { increment: 1 },
      },
      create: {
        playerId,
        dungeonId,
        attempts: 1,
      },
    });

    return {
      dungeon,
      progress,
      monsters: dungeon.monsters,
    };
  }

  static async completeDungeon(playerId: string, dungeonId: string, timeSpent: number) {
    const dungeon = await prisma.dungeon.findUnique({
      where: { id: dungeonId },
    });

    if (!dungeon) {
      throw new Error('Dungeon not found');
    }

    // Calculate rewards
    const goldReward = dungeon.goldReward * BigInt(Math.floor(dungeon.rewardMultiplier));
    const expReward = dungeon.expReward * BigInt(Math.floor(dungeon.rewardMultiplier));
    const stars = this.calculateStars(timeSpent, dungeon.completionTime);

    // Update progress
    await prisma.playerDungeonProgress.update({
      where: {
        playerId_dungeonId: {
          playerId,
          dungeonId,
        },
      },
      data: {
        progress: 100, // Complete
        bestTime: timeSpent,
      },
    });

    // Record completion
    const history = await prisma.playerDungeonHistory.create({
      data: {
        playerId,
        dungeonId,
        timeSpent,
        stars,
        goldEarned: goldReward,
        expEarned: expReward,
      },
    });

    // Update player rewards
    await prisma.player.update({
      where: { id: playerId },
      data: {
        gold: { increment: goldReward },
        experience: { increment: expReward },
      },
    });

    return {
      history,
      goldReward,
      expReward,
      stars,
    };
  }

  static calculateStars(timeSpent: number, expectedTime?: number): number {
    if (!expectedTime) {
      return 3; // Default 3 stars if no expected time
    }

    if (timeSpent <= expectedTime) {
      return 3;
    } else if (timeSpent <= expectedTime * 1.5) {
      return 2;
    } else {
      return 1;
    }
  }

  // Query utilities
  static async getLeaderboard(type: 'level' | 'gold' | 'dungeons', limit = 10) {
    switch (type) {
      case 'level':
        return await prisma.player.findMany({
          orderBy: [
            { level: 'desc' },
            { experience: 'desc' },
          ],
          take: limit,
          select: {
            id: true,
            username: true,
            level: true,
            experience: true,
            cultivationTier: {
              select: {
                name: true,
              },
            },
          },
        });

      case 'gold':
        return await prisma.player.findMany({
          orderBy: { gold: 'desc' },
          take: limit,
          select: {
            id: true,
            username: true,
            gold: true,
            level: true,
          },
        });

      case 'dungeons':
        return await prisma.playerDungeonHistory.groupBy({
          by: ['playerId'],
          where: {
            completedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          _count: {
            playerId: true,
          },
          orderBy: {
            _count: {
              playerId: 'desc',
            },
          },
          take: limit,
        });

      default:
        throw new Error('Invalid leaderboard type');
    }
  }
}

export default GameUtils;