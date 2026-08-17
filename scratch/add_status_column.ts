import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "AutomationWorkflow" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';`);
  console.log('✅ Added status column to AutomationWorkflow table.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
