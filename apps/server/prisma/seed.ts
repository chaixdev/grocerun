import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Demo Household
  const demoHousehold = await prisma.household.upsert({
    where: { id: 'demo-household-1' },
    update: {},
    create: {
      id: 'demo-household-1',
      name: 'Demo Household',
      ownerId: null, // Will be set after creating user
    },
  });

  console.log('✅ Created household:', demoHousehold.name);

  // Create Demo User
  const demoUser = await prisma.user.upsert({
    where: { id: 'demo-user-1' },
    update: {},
    create: {
      id: 'demo-user-1',
      email: 'demo@grocerun.local',
      name: 'Demo User',
      households: {
        connect: { id: demoHousehold.id },
      },
    },
  });

  console.log('✅ Created user:', demoUser.email);

  // Update household owner
  await prisma.household.update({
    where: { id: demoHousehold.id },
    data: {
      ownerId: demoUser.id,
    },
  });

  // Create some demo items
  const item1 = await prisma.item.upsert({
    where: { id: 'demo-item-1' },
    update: {},
    create: {
      id: 'demo-item-1',
      name: 'Milk',
      checked: false,
    },
  });

  const item2 = await prisma.item.upsert({
    where: { id: 'demo-item-2' },
    update: {},
    create: {
      id: 'demo-item-2',
      name: 'Bread',
      checked: false,
    },
  });

  console.log('✅ Created items:', item1.name, item2.name);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
