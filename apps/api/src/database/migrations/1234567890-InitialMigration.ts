import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schemas
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS security');

    // Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "firstName" VARCHAR(255),
        "lastName" VARCHAR(255),
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."roles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(225) NOT NULL UNIQUE,
        "description" VARCHAR(225),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."permissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(225) NOT NULL UNIQUE,
        "description" VARCHAR(225),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create user_role table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."user_role" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "role_id" UUID NOT NULL REFERENCES "security"."roles"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create permission_role table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."permission_role" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "permission_id" UUID NOT NULL REFERENCES "security"."permissions"("id") ON DELETE CASCADE,
        "role_id" UUID NOT NULL REFERENCES "security"."roles"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users"("email")');
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "security"."roles"("name")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_permissions_name" ON "security"."permissions"("name")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_permissions_name"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_roles_name"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_users_email"');
    await queryRunner.query('DROP TABLE IF EXISTS "security"."permission_role"');
    await queryRunner.query('DROP TABLE IF EXISTS "security"."user_role"');
    await queryRunner.query('DROP TABLE IF EXISTS "security"."permissions"');
    await queryRunner.query('DROP TABLE IF EXISTS "security"."roles"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."users"');
    await queryRunner.query('DROP SCHEMA IF EXISTS "security"');
  }
}

