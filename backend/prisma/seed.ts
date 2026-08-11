import { PrismaNeon } from '@prisma/adapter-neon';
import * as bcrypt from 'bcrypt';

import { PrismaClient } from '../generated/prisma/client';
import { DEMO_USER_ID } from '../src/common/constants/current-user.constant';

if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu biến môi trường DATABASE_URL (connection string Postgres/Neon).');
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

/** Mật khẩu demo cho môi trường dev/local - không dùng cho production. */
const DEMO_PASSWORD = 'Demo1234!';

interface CategorySeed {
  id: string;
  name: string;
  kind: 'INCOME' | 'EXPENSE';
  color: string;
}

const EXPENSE_CATEGORIES: CategorySeed[] = [
  { id: 'demo-cat-an-uong', name: 'Ăn uống', kind: 'EXPENSE', color: '#f97316' },
  { id: 'demo-cat-di-chuyen', name: 'Di chuyển', kind: 'EXPENSE', color: '#0ea5e9' },
  { id: 'demo-cat-mua-sam', name: 'Mua sắm', kind: 'EXPENSE', color: '#ec4899' },
  { id: 'demo-cat-hoa-don', name: 'Hoá đơn & tiện ích', kind: 'EXPENSE', color: '#64748b' },
  { id: 'demo-cat-giai-tri', name: 'Giải trí', kind: 'EXPENSE', color: '#a855f7' },
  { id: 'demo-cat-suc-khoe', name: 'Sức khoẻ', kind: 'EXPENSE', color: '#ef4444' },
  { id: 'demo-cat-nha-o', name: 'Nhà ở', kind: 'EXPENSE', color: '#78716c' },
  { id: 'demo-cat-giao-duc', name: 'Giáo dục', kind: 'EXPENSE', color: '#eab308' },
];

const INCOME_CATEGORIES: CategorySeed[] = [
  { id: 'demo-cat-luong', name: 'Lương', kind: 'INCOME', color: '#16a34a' },
  { id: 'demo-cat-thuong', name: 'Thưởng', kind: 'INCOME', color: '#22c55e' },
  { id: 'demo-cat-thu-nhap-khac', name: 'Thu nhập khác', kind: 'INCOME', color: '#84cc16' },
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/** RNG có seed cố định để dữ liệu giả tạo ra ổn định giữa các lần chạy seed. */
function createRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const EXPENSE_DESCRIPTIONS: Record<string, { desc: string; min: number; max: number }[]> = {
  'demo-cat-an-uong': [
    { desc: 'Ăn trưa văn phòng', min: 30_000, max: 60_000 },
    { desc: 'Đi chợ nấu ăn', min: 100_000, max: 300_000 },
    { desc: 'Cà phê', min: 25_000, max: 55_000 },
    { desc: 'Ăn tối cùng bạn bè', min: 150_000, max: 400_000 },
  ],
  'demo-cat-di-chuyen': [
    { desc: 'Đổ xăng', min: 60_000, max: 120_000 },
    { desc: 'Grab/taxi', min: 30_000, max: 150_000 },
    { desc: 'Gửi xe tháng', min: 100_000, max: 200_000 },
  ],
  'demo-cat-mua-sam': [
    { desc: 'Mua quần áo', min: 200_000, max: 800_000 },
    { desc: 'Mua đồ gia dụng', min: 150_000, max: 600_000 },
    { desc: 'Mua sắm online', min: 100_000, max: 500_000 },
  ],
  'demo-cat-hoa-don': [
    { desc: 'Tiền điện', min: 300_000, max: 700_000 },
    { desc: 'Tiền nước', min: 80_000, max: 150_000 },
    { desc: 'Cước internet', min: 165_000, max: 220_000 },
    { desc: 'Cước điện thoại', min: 100_000, max: 200_000 },
  ],
  'demo-cat-giai-tri': [
    { desc: 'Xem phim', min: 90_000, max: 180_000 },
    { desc: 'Gói Netflix/Spotify', min: 79_000, max: 260_000 },
    { desc: 'Đi du lịch cuối tuần', min: 500_000, max: 2_000_000 },
  ],
  'demo-cat-suc-khoe': [
    { desc: 'Mua thuốc', min: 50_000, max: 200_000 },
    { desc: 'Khám sức khoẻ', min: 200_000, max: 800_000 },
    { desc: 'Tập gym tháng', min: 300_000, max: 600_000 },
  ],
  'demo-cat-nha-o': [
    { desc: 'Tiền thuê nhà', min: 3_000_000, max: 5_000_000 },
    { desc: 'Sửa chữa nhà cửa', min: 200_000, max: 1_000_000 },
  ],
  'demo-cat-giao-duc': [
    { desc: 'Mua sách', min: 80_000, max: 250_000 },
    { desc: 'Khoá học online', min: 300_000, max: 1_500_000 },
  ],
};

const INCOME_DESCRIPTIONS: Record<string, { desc: string; min: number; max: number }[]> = {
  'demo-cat-luong': [{ desc: 'Lương tháng', min: 15_000_000, max: 25_000_000 }],
  'demo-cat-thuong': [
    { desc: 'Thưởng dự án', min: 1_000_000, max: 5_000_000 },
    { desc: 'Thưởng hiệu suất', min: 500_000, max: 3_000_000 },
  ],
  'demo-cat-thu-nhap-khac': [
    { desc: 'Freelance', min: 500_000, max: 4_000_000 },
    { desc: 'Bán đồ cũ', min: 100_000, max: 800_000 },
  ],
};

async function main(): Promise<void> {
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: { passwordHash: demoPasswordHash },
    create: {
      id: DEMO_USER_ID,
      email: 'demo@example.com',
      name: 'Người dùng Demo',
      passwordHash: demoPasswordHash,
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

  const accounts = [cashAccount, bankAccount];

  // Ánh xạ từ "key" danh mục (dùng nội bộ trong file seed) sang id thật trong DB,
  // vì upsert theo (userId, name) có thể trả về id đã tồn tại từ lần seed trước.
  const categoryIdByKey = new Map<string, string>();
  for (const category of ALL_CATEGORIES) {
    const saved = await prisma.category.upsert({
      where: { userId_name: { userId: DEMO_USER_ID, name: category.name } },
      update: { kind: category.kind, color: category.color },
      create: {
        id: category.id,
        userId: DEMO_USER_ID,
        name: category.name,
        kind: category.kind,
        color: category.color,
      },
    });
    categoryIdByKey.set(category.id, saved.id);
  }

  // Xoá giao dịch demo cũ (nếu chạy seed lại) để tránh trùng lặp, giữ lại dữ liệu người dùng khác nếu có.
  await prisma.transaction.deleteMany({ where: { userId: DEMO_USER_ID } });

  const rng = createRng(42);
  const now = new Date('2026-08-10T12:00:00');
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const transactionsToCreate: {
    userId: string;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: number;
    date: Date;
    description: string;
  }[] = [];

  // Lương cố định vào ngày 5 mỗi tháng, 3 tháng gần nhất.
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const salaryDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 5, 9, 0);
    if (salaryDate <= now) {
      transactionsToCreate.push({
        userId: DEMO_USER_ID,
        accountId: bankAccount.id,
        categoryId: categoryIdByKey.get('demo-cat-luong'),
        type: 'INCOME',
        amount: randomInt(rng, 15_000_000, 25_000_000),
        date: salaryDate,
        description: 'Lương tháng',
      });
    }
  }

  // Vài khoản thu nhập phụ ngẫu nhiên.
  for (let i = 0; i < 5; i++) {
    const category = pick(rng, INCOME_CATEGORIES.filter((c) => c.id !== 'demo-cat-luong'));
    const options = INCOME_DESCRIPTIONS[category.id];
    const option = pick(rng, options);
    const date = randomDateBetween(rng, threeMonthsAgo, now);
    transactionsToCreate.push({
      userId: DEMO_USER_ID,
      accountId: pick(rng, accounts).id,
      categoryId: categoryIdByKey.get(category.id),
      type: 'INCOME',
      amount: randomInt(rng, option.min, option.max),
      date,
      description: option.desc,
    });
  }

  // Vài giao dịch chuyển khoản giữa 2 tài khoản.
  for (let i = 0; i < 3; i++) {
    const date = randomDateBetween(rng, threeMonthsAgo, now);
    transactionsToCreate.push({
      userId: DEMO_USER_ID,
      accountId: bankAccount.id,
      toAccountId: cashAccount.id,
      type: 'TRANSFER',
      amount: randomInt(rng, 500_000, 3_000_000),
      date,
      description: 'Rút tiền mặt',
    });
  }

  // Chi tiêu ngẫu nhiên trải khắp 3 tháng để đủ tối thiểu 40 giao dịch.
  const expenseCount = 40 - transactionsToCreate.length;
  for (let i = 0; i < expenseCount; i++) {
    const category = pick(rng, EXPENSE_CATEGORIES);
    const options = EXPENSE_DESCRIPTIONS[category.id];
    const option = pick(rng, options);
    const date = randomDateBetween(rng, threeMonthsAgo, now);
    transactionsToCreate.push({
      userId: DEMO_USER_ID,
      accountId: pick(rng, accounts).id,
      categoryId: categoryIdByKey.get(category.id),
      type: 'EXPENSE',
      amount: randomInt(rng, option.min, option.max),
      date,
      description: option.desc,
    });
  }

  transactionsToCreate.sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const tx of transactionsToCreate) {
    await prisma.transaction.create({ data: tx });
  }

  console.log({
    userId: DEMO_USER_ID,
    accounts: accounts.map((a) => a.id),
    categories: ALL_CATEGORIES.map((c) => c.id),
    transactions: transactionsToCreate.length,
    demoLogin: { email: 'demo@example.com', password: DEMO_PASSWORD },
  });
}

function randomDateBetween(rng: () => number, start: Date, end: Date): Date {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const date = new Date(startMs + rng() * (endMs - startMs));
  date.setHours(randomInt(rng, 7, 21), randomInt(rng, 0, 59), 0, 0);
  return date;
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
