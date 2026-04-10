#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Определяем директорию проекта
const projectRoot = process.env.PWD || process.cwd();

// Поиск и загрузка .env файлов с приоритетом
const envFiles = [
  path.join(projectRoot, `.env.${process.env.NODE_ENV || 'development'}.local`),
  path.join(projectRoot, '.env.local'),
  path.join(projectRoot, '.env'),
];

let envLoaded = false;

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    console.log(`📋 Загружаю переменные из: ${path.relative(projectRoot, envFile)}`);
    dotenv.config({ path: envFile });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  Файлы .env не найдены, используются переменные системы');
}

// Если DATABASE_URL не установлена, строим её из POSTGRES_* переменных
if (!process.env.DATABASE_URL) {
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgres';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const db = process.env.POSTGRES_DB || 'library';

  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${db}`;
  console.log(`🔨 DATABASE_URL построена из POSTGRES_* переменных`);
}

console.log(`✅ DATABASE_URL установлена`);

// Генерируем Prisma клиент
console.log(`\n📦 Генерирую Prisma клиент...`);
try {
  execSync('npx prisma generate', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
} catch (error) {
  console.warn('⚠️  Ошибка при генерации Prisma (некритичная)');
}

// Применяем миграции БД
console.log(`\n🗂️  Применяю миграции БД...`);
try {
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
  console.log('✅ Миграции успешно применены');
} catch (error) {
  console.log('⚠️  Не удалось применить миграции (БД может быть недоступна)');
  console.log('   Приложение будет пытаться подключиться при запуске...');
}

console.log(`\n🚀 Запускаю приложение...\n`);

// Запускаем приложение
const modulePath = path.join(__dirname, '../src/main.ts');
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});
require(modulePath);

