import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: ':memory:',
    },
  },
});

beforeAll(async () => {
  // Setup test database if needed
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };