import { EquipmentRarity, MonsterType, DungeonDifficulty, Effect } from './types';

// Utility functions for common game operations
export class GameUtils {
  // Player utilities
  static async createPlayer(username: string, email?: string): Promise<any> {
    // This will need to be implemented in the server with Prisma
    throw new Error('createPlayer must be implemented in server context with Prisma');
  }

  static async getPlayerStats(playerId: string): Promise<any> {
    // This will need to be implemented in the server with Prisma
    throw new Error('getPlayerStats must be implemented in server context with Prisma');
  }

  static async levelUpPlayer(playerId: string): Promise<any> {
    // This will need to be implemented in the server with Prisma
    throw new Error('levelUpPlayer must be implemented in server context with Prisma');
  }

  // Equipment utilities
  static async equipItem(playerId: string, equipmentId: string): Promise<any> {
    // This will need to be implemented in the server with Prisma
    throw new Error('equipItem must be implemented in server context with Prisma');
  }

  // Battle utilities (these can be used in both client and server)
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

  static simulateBattle(
    playerStats: any,
    monster: any
  ): { success: boolean; playerHp: number; playerMp: number; goldEarned: bigint; expEarned: bigint; itemsDropped: any[] } | { success: boolean; playerHp: number; details: any } {
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

    return {
      success,
      playerHp,
      details: {
        playerDamage,
        monsterDamage,
        monsterHp: Math.max(0, monsterHp),
      }
    };
  }

  static calculateLoot(lootTable: any): any[] {
    if (!lootTable || !lootTable.items) {
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
    // This will need to be implemented in the server with Prisma
    throw new Error('startDungeon must be implemented in server context with Prisma');
  }

  static async completeDungeon(playerId: string, dungeonId: string, timeSpent: number) {
    // This will need to be implemented in the server with Prisma
    throw new Error('completeDungeon must be implemented in server context with Prisma');
  }

  static calculateStars(timeSpent: number, targetTime?: number): number {
    if (!targetTime) return 1;
    
    if (timeSpent <= targetTime) return 3;
    if (timeSpent <= targetTime * 1.5) return 2;
    return 1;
  }

  // Utility functions for UI calculations
  static getRarityColor(rarity: EquipmentRarity): string {
    switch (rarity) {
      case EquipmentRarity.COMMON:
        return '#9e9e9e'; // gray
      case EquipmentRarity.UNCOMMON:
        return '#4caf50'; // green
      case EquipmentRarity.RARE:
        return '#2196f3'; // blue
      case EquipmentRarity.EPIC:
        return '#9c27b0'; // purple
      case EquipmentRarity.LEGENDARY:
        return '#ff9800'; // orange
      case EquipmentRarity.MYTHIC:
        return '#f44336'; // red
      default:
        return '#9e9e9e';
    }
  }

  static getDifficultyColor(difficulty: DungeonDifficulty): string {
    switch (difficulty) {
      case DungeonDifficulty.EASY:
        return '#4caf50'; // green
      case DungeonDifficulty.NORMAL:
        return '#2196f3'; // blue
      case DungeonDifficulty.HARD:
        return '#ff9800'; // orange
      case DungeonDifficulty.EXPERT:
        return '#f44336'; // red
      case DungeonDifficulty.NIGHTMARE:
        return '#9c27b0'; // purple
      default:
        return '#2196f3';
    }
  }

  static formatLargeNumber(num: bigint | number): string {
    if (typeof num === 'bigint') {
      if (num >= BigInt(1000000)) {
        return `${(num / BigInt(1000000)).toString()}M`;
      }
      if (num >= BigInt(1000)) {
        return `${(num / BigInt(1000)).toString()}K`;
      }
      return num.toString();
    }
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  static getCultivationLevelName(level: number): { chinese: string; english: string } {
    const levels = [
      { chinese: '凡人', english: 'Mortal' },
      { chinese: '炼气期', english: 'Qi Refining' },
      { chinese: '筑基期', english: 'Foundation Building' },
      { chinese: '金丹期', english: 'Golden Core' },
      { chinese: '元婴期', english: 'Nascent Soul' },
      { chinese: '化神期', english: 'Spirit Transformation' },
      { chinese: '炼虚期', english: 'Void Refining' },
      { chinese: '合体期', english: 'Body Integration' },
      { chinese: '大乘期', english: 'Mahayana' },
      { chinese: '渡劫期', english: 'Tribulation Crossing' },
      { chinese: '仙人', english: 'Immortal' },
    ];
    
    const index = Math.max(0, Math.min(level - 1, levels.length - 1));
    return levels[index]!;
  }

  static calculateExperienceProgress(currentExp: bigint, tierMinExp: bigint, tierMaxExp: bigint): number {
    const totalNeeded = tierMaxExp - tierMinExp;
    const currentProgress = currentExp - tierMinExp;
    return Number((currentProgress * BigInt(100)) / totalNeeded);
  }
}