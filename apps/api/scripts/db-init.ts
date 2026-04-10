#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
const projectRoot = path.join(__dirname, '../../../');
const envFile = path.join(projectRoot, `.env.${process.env.NODE_ENV || 'development'}.local`);
dotenv.config({ path: envFile });
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });

const { execSync, spawnSync } = require('child_process');

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // Ensure DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || 'postgres';
      const host = process.env.POSTGRES_HOST || 'localhost';
      const port = process.env.POSTGRES_PORT || '5432';
      const database = process.env.POSTGRES_DB || 'library';
      process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    }

    console.log(`📍 Database URL: ${process.env.DATABASE_URL.replace(/:[^@]*@/, ':****@')}`);

    // Try to generate Prisma client
    console.log('📦 Generating Prisma client...');
    try {
      execSync('npx prisma generate', {
        cwd: __dirname,
        stdio: 'inherit',
      });
    } catch (error) {
      console.warn('⚠️ Prisma generate warning (non-critical)');
    }

    // Try to apply migrations
    console.log('🗂️ Applying database migrations...');
    try {
      execSync('npx prisma migrate deploy', {
        cwd: __dirname,
        stdio: 'inherit',
        env: process.env,
      });
      console.log('✅ Database migrations applied successfully');
    } catch (error) {
      console.log('⚠️ Could not apply migrations (database might not be running yet)');
      console.log('   The app will retry on startup...');
    }

    console.log('✨ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't exit - let the app handle connection retries
  }
}

// Run if this is the main module
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

export default initializeDatabase;

