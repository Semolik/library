#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const projectRoot = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function initEnv() {
  console.log('🚀 Инициализация переменных окружения\n');

  const envLocalPath = path.join(projectRoot, '.env.local');

  if (fs.existsSync(envLocalPath)) {
    const overwrite = await question('⚠️  .env.local уже существует. Перезаписать? (y/n) ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Отменено');
      rl.close();
      process.exit(1);
    }
  }

  const answers = {
    PORT: await question('Какой порт использовать для API? (3001): ') || '3001',
    POSTGRES_USER: await question('Пользователь PostgreSQL? (postgres): ') || 'postgres',
    POSTGRES_PASSWORD: await question('Пароль PostgreSQL? (postgres): ') || 'postgres',
    POSTGRES_DB: await question('Имя БД? (library): ') || 'library',
    POSTGRES_HOST: await question('Хост PostgreSQL? (localhost): ') || 'localhost',
    POSTGRES_PORT: await question('Порт PostgreSQL? (5432): ') || '5432',
    CORS_ORIGIN: await question('CORS origin для фронтенда? (http://localhost:3000): ') || 'http://localhost:3000',
  };

  const envContent = `# API Server Configuration
PORT=${answers.PORT}
NODE_ENV=development

# PostgreSQL Configuration
POSTGRES_USER=${answers.POSTGRES_USER}
POSTGRES_PASSWORD=${answers.POSTGRES_PASSWORD}
POSTGRES_DB=${answers.POSTGRES_DB}
POSTGRES_HOST=${answers.POSTGRES_HOST}
POSTGRES_PORT=${answers.POSTGRES_PORT}

# JWT Configuration
JWT_SECRET=dev_secret_key_${Math.random().toString(36).substring(2, 15)}
JWT_EXPIRATION=3600
JWT_REFRESH_SECRET=dev_refresh_secret_${Math.random().toString(36).substring(2, 15)}
JWT_REFRESH_EXPIRATION=604800

# CORS
CORS_ORIGIN=${answers.CORS_ORIGIN}
`;

  fs.writeFileSync(envLocalPath, envContent, 'utf-8');

  console.log('\n✅ .env.local создан успешно!\n');
  console.log('📋 Созданная конфигурация:');
  console.log(`  PORT: ${answers.PORT}`);
  console.log(`  PostgreSQL: ${answers.POSTGRES_USER}@${answers.POSTGRES_HOST}:${answers.POSTGRES_PORT}/${answers.POSTGRES_DB}`);
  console.log(`  CORS origin: ${answers.CORS_ORIGIN}`);
  console.log('\n💡 Подсказка: используйте "npm run verify:env" для проверки конфигурации');
  console.log('💡 Подсказка: используйте "npm run db:push" для инициализации БД\n');

  rl.close();
}

initEnv().catch(err => {
  console.error('❌ Ошибка:', err.message);
  rl.close();
  process.exit(1);
});

