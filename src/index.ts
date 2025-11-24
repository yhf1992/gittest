// Main exports for the cultivation game core
export * from './types';
export { GameUtils } from './utils/gameUtils';

// Re-export Prisma client
export { PrismaClient } from '@prisma/client';

// Default export of Prisma client instance
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();