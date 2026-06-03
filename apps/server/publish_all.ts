import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.module.updateMany({ data: { isPublished: true } });
  await prisma.chapter.updateMany({ data: { isPublished: true } });
  await prisma.lesson.updateMany({ data: { isPublished: true } });
  console.log('All modules, chapters, and lessons published!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
