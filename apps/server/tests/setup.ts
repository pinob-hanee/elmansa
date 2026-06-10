// Setup file for Jest
import { prisma } from '../src/config/database';

afterAll(async () => {
  await prisma.$disconnect();
});
