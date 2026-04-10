#!/usr/bin/env node

/**
 * Скрипт-обертка для загрузки переменных окружения перед выполнением команды
 * Использование: node scripts/with-env.js <command> [args...]
 */

require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}.local`,
});
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Устанавливаем DATABASE_URL, если не установлена
if (!process.env.DATABASE_URL) {
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgres';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const database = process.env.POSTGRES_DB || 'library';
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

// Получаем команду и аргументы
const args = process.argv.slice(2);
const command = args[0];
const commandArgs = args.slice(1);

// Используем spawn для запуска команды
const { spawn } = require('child_process');
const proc = spawn(command, commandArgs, {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

proc.on('exit', (code) => {
  process.exit(code);
});

