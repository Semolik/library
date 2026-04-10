#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
        env[key.trim()] = value.trim();
      }
    }
  });

  return env;
}

function buildDatabaseUrl(env) {
  const user = env.POSTGRES_USER || 'postgres';
  const password = env.POSTGRES_PASSWORD || 'postgres';
  const host = env.POSTGRES_HOST || 'localhost';
  const port = env.POSTGRES_PORT || '5432';
  const db = env.POSTGRES_DB || 'library';

  return `postgresql://${user}:${password}@${host}:${port}/${db}`;
}

console.log('🔍 Проверка переменных окружения...\n');

// Приоритет файлов
const envFiles = [
  `.env.development.local`,
  `.env.local`,
  `.env`,
];

let activeEnv = null;
let activeFile = null;

for (const file of envFiles) {
  const filePath = path.join(projectRoot, file);
  const env = loadEnv(filePath);

  if (env && Object.keys(env).length > 0) {
    activeEnv = env;
    activeFile = file;
    console.log(`✅ Используется файл: ${file}\n`);
    break;
  }
}

if (!activeEnv) {
  console.error('❌ Не найдены файлы с переменными окружения!');
  console.error('Создайте один из файлов:');
  envFiles.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}

// Проверка обязательных переменных
const requiredVars = [
  'PORT',
  'NODE_ENV',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

console.log('📋 Проверка переменных:\n');

let allValid = true;
requiredVars.forEach(varName => {
  const value = activeEnv[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') ? '***' : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: НЕ УСТАНОВЛЕНА`);
    allValid = false;
  }
});

// Построение DATABASE_URL
console.log('\n🗄️  Построение DATABASE_URL:\n');
const databaseUrl = buildDatabaseUrl(activeEnv);
console.log(`  PostgreSQL URL: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);

console.log('\n✨ Финальная конфигурация:\n');
console.log(`  Сервер:      http://localhost:${activeEnv.PORT || 3001}`);
console.log(`  БД хост:     ${activeEnv.POSTGRES_HOST || 'localhost'}`);
console.log(`  БД порт:     ${activeEnv.POSTGRES_PORT || 5432}`);
console.log(`  БД имя:      ${activeEnv.POSTGRES_DB || 'library'}`);
console.log(`  БД юзер:     ${activeEnv.POSTGRES_USER || 'postgres'}`);
console.log(`  Окружение:   ${activeEnv.NODE_ENV || 'development'}`);
console.log(`  CORS origin: ${activeEnv.CORS_ORIGIN || 'http://localhost:3000'}`);

if (!allValid) {
  console.log('\n⚠️  ВНИМАНИЕ: Некоторые переменные не установлены!\n');
  process.exit(1);
}

console.log('\n✅ Все переменные окружения установлены корректно!\n');
process.exit(0);

