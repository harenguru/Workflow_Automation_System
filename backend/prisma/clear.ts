import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.rule.deleteMany();
  await prisma.execution.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workflow.deleteMany();
  console.log('All data cleared.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
