import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const department = await prisma.department.upsert({
    where: { name: 'General' },
    update: {},
    create: { name: 'General' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@test.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      departmentId: department.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'worker@test.com' },
    update: {},
    create: {
      name: 'Worker',
      email: 'worker@test.com',
      password: await bcrypt.hash('worker123', 10),
      role: 'WORKER',
      departmentId: department.id,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
