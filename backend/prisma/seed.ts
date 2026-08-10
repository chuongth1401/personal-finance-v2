import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '../generated/prisma/client';
import { DEMO_USER_ID } from '../src/common/constants/current-user.constant';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' }),
});

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: 'demo@example.com',
      name: 'Người dùng Demo',
    },
  });

  const cashAccount = await prisma.account.upsert({
    where: { id: 'demo-account-cash' },
    update: {},
    create: {
      id: 'demo-account-cash',
      userId: DEMO_USER_ID,
      name: 'Tiền mặt',
      type: 'CASH',
      balance: 2_000_000,
    },
  });

  const bankAccount = await prisma.account.upsert({
    where: { id: 'demo-account-bank' },
    update: {},
    create: {
      id: 'demo-account-bank',
      userId: DEMO_USER_ID,
      name: 'Vietcombank',
      type: 'BANK',
      balance: 20_000_000,
    },
  });

  const foodCategory = await prisma.category.upsert({
    where: { userId_name: { userId: DEMO_USER_ID, name: 'Ăn uống' } },
    update: {},
    create: {
      userId: DEMO_USER_ID,
      name: 'Ăn uống',
      kind: 'EXPENSE',
      color: '#f97316',
    },
  });

  const salaryCategory = await prisma.category.upsert({
    where: { userId_name: { userId: DEMO_USER_ID, name: 'Lương' } },
    update: {},
    create: {
      userId: DEMO_USER_ID,
      name: 'Lương',
      kind: 'INCOME',
      color: '#16a34a',
    },
  });

  console.log({
    userId: DEMO_USER_ID,
    accounts: [cashAccount.id, bankAccount.id],
    categories: [foodCategory.id, salaryCategory.id],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
