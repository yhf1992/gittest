import { PrismaClient } from '@prisma/client';

// Setup test database connection and global utilities
const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure database connection is established before tests
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up database connection after tests
  await prisma.$disconnect();
});

// Export prisma instance for use in tests
(global as any).prisma = prisma;

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};