import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { 
  Player, 
  CreatePlayerRequest, 
  EquipItemRequest, 
  StartDungeonRequest, 
  CompleteDungeonRequest,
  ApiResponse,
  GameUtils
} from 'xianxia-shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Create server-specific GameUtils with Prisma
class ServerGameUtils extends GameUtils {
  static override async createPlayer(username: string, email?: string) {
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

  static override async getPlayerStats(playerId: string) {
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

  static override async equipItem(playerId: string, equipmentId: string) {
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

  static override async simulateBattle(playerId: string, monsterId: string): Promise<any> {
    const playerStats = await this.getPlayerStats(playerId);
    const monster = await prisma.monster.findUnique({
      where: { id: monsterId },
      include: { lootTable: true },
    });

    if (!monster) {
      throw new Error('Monster not found');
    }

    const battleResult = GameUtils.simulateBattle(playerStats, monster);

    if (battleResult.success) {
      // Calculate loot
      const loot = GameUtils.calculateLoot(monster.lootTable);
      
      // Update player
      await prisma.player.update({
        where: { id: playerId },
        data: {
          currentHp: Math.max(0, battleResult.playerHp),
          experience: { increment: monster.expReward },
          gold: { increment: monster.goldReward },
        },
      });

      return {
        success: true,
        playerHp: battleResult.playerHp,
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
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// Player routes
app.get('/api/players', async (_req, res) => {
  try {
    const players = await prisma.player.findMany({
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
    
    const response: ApiResponse<Player[]> = {
      success: true,
      data: players.map(p => ({
        ...p,
        email: p.email || undefined,
        cultivationTier: p.cultivationTier ? {
          ...p.cultivationTier,
          description: p.cultivationTier.description || undefined
        } : undefined
      })),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<Player[]> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { username, email }: CreatePlayerRequest = req.body;
    const player = await ServerGameUtils.createPlayer(username, email);
    
    const response: ApiResponse<Player> = {
      success: true,
      data: {
        ...player,
        email: player.email || undefined,
        cultivationTier: player.cultivationTier ? {
          ...player.cultivationTier,
          description: player.cultivationTier.description || undefined
        } : undefined
      },
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<Player> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.get('/api/players/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await ServerGameUtils.getPlayerStats(id);
    
    const response: ApiResponse<any> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.post('/api/players/:id/equip', async (req, res) => {
  try {
    const { id } = req.params;
    const { equipmentId }: EquipItemRequest = req.body;
    const result = await ServerGameUtils.equipItem(id, equipmentId);
    
    const response: ApiResponse<any> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.post('/api/players/:id/battle/:monsterId', async (req, res) => {
  try {
    const { id, monsterId } = req.params;
    const result = await ServerGameUtils.simulateBattle(id, monsterId);
    
    const response: ApiResponse<any> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  const response: ApiResponse<null> = {
    success: false,
    error: 'Something went wrong!',
  };
  res.status(500).json(response);
});

// 404 handler
app.use('*', (_req, res) => {
  const response: ApiResponse<null> = {
    success: false,
    error: 'Route not found',
  };
  res.status(404).json(response);
});

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();