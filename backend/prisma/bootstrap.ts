import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const name = process.env.BOOTSTRAP_NAME;
  const email = process.env.BOOTSTRAP_EMAIL;
  const password = process.env.BOOTSTRAP_PASSWORD;

  if (!name || !email || !password) {
    console.error('Faltan variables de entorno: BOOTSTRAP_NAME, BOOTSTRAP_EMAIL, BOOTSTRAP_PASSWORD');
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({ where: { isSuperUser: true } });
  if (existing) {
    console.error('Ya existe un Super Usuario en la base de datos. Bootstrap cancelado.');
    process.exit(1);
  }

  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS disabled_users (user_id INTEGER PRIMARY KEY)`;

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: Role.ADMIN,
      isSuperUser: true,
    },
  });

  console.log(`Super Usuario creado: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
