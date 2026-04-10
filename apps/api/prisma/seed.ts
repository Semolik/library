import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// Загружаем переменные окружения
const projectRoot = path.join(__dirname, '../../../');
dotenv.config({ path: path.join(projectRoot, `.env.${process.env.NODE_ENV || 'development'}.local`) });
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Cleanup
  await prisma.user.deleteMany({});

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

