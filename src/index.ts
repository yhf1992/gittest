// Main exports for the cultivation game core
export * from './types';
export { default as GameUtils } from './utils/gameUtils';

// Re-export Prisma types for convenience
export {
  PrismaClient,
  EquipmentSlot,
  EquipmentRarity,
  MonsterType,
  DungeonDifficulty,
  Effect,
} from '@prisma/client';

// Default export of Prisma client
import { PrismaClient as PrismaClientType } from '@prisma/client';
export const prisma = new PrismaClientType();
export { PrismaClientType as PrismaClient };