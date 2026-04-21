import { config } from 'dotenv';
import { afterAll, beforeEach } from 'vitest';

import prisma from '../src/config/database';

config({ path: '.env.test' });

beforeEach(async () => {
  await prisma.task.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
