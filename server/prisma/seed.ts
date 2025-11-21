import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      username: 'cultivator',
      email: 'cultivator@xianxia.com',
      level: 5,
      experience: 1500,
      health: 250,
      maxHealth: 250,
    },
  });

  console.log('Created user:', user);

  // Create a sample character
  const character = await prisma.character.create({
    data: {
      userId: user.id,
      name: 'Wei Chen',
      class: 'warrior',
      level: 3,
      experience: 750,
      health: 180,
      maxHealth: 180,
      attack: 25,
      defense: 20,
    },
  });

  console.log('Created character:', character);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });