import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Единая начальная схема: security + библиотека + связи ролей через roles_x_* (без legacy user_role / permission_role).
 * Заменяет прежние InitialMigration1710000000000 и LibrarySchemaAndMinio1710000001000.
 */
export class DatabaseSchema1747200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS security');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "firstName" VARCHAR(255),
        "lastName" VARCHAR(255),
        "middle_name" VARCHAR(255),
        "phone" VARCHAR(50),
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."roles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(225) NOT NULL UNIQUE,
        "description" VARCHAR(225),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."permissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(225) NOT NULL UNIQUE,
        "description" VARCHAR(225),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."roles_x_users" (
        "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "role_id" UUID NOT NULL REFERENCES "security"."roles"("id") ON DELETE CASCADE,
        PRIMARY KEY ("user_id", "role_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "security"."roles_x_permissions" (
        "role_id" UUID NOT NULL REFERENCES "security"."roles"("id") ON DELETE CASCADE,
        "permission_id" UUID NOT NULL REFERENCES "security"."permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("role_id", "permission_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."categories" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."publishing_houses" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."cities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."authors" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_name" TEXT NOT NULL,
        "last_name" TEXT NOT NULL,
        "middle_name" TEXT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."storage" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."books" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "category_id" UUID NOT NULL REFERENCES "public"."categories"("id"),
        "publishing_house_id" UUID NOT NULL REFERENCES "public"."publishing_houses"("id"),
        "city_id" UUID NOT NULL REFERENCES "public"."cities"("id"),
        "title" TEXT NOT NULL,
        "publication_year" INT NOT NULL,
        "pages" INT NOT NULL,
        "isbn" TEXT NOT NULL,
        "has_cover" BOOLEAN NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."books_authors" (
        "book_id" UUID NOT NULL REFERENCES "public"."books"("id") ON DELETE CASCADE,
        "author_id" UUID NOT NULL REFERENCES "public"."authors"("id") ON DELETE CASCADE,
        PRIMARY KEY ("book_id", "author_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."book_copies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "book_id" UUID NOT NULL REFERENCES "public"."books"("id"),
        "storage_id" UUID NOT NULL REFERENCES "public"."storage"("id"),
        "inventory_number" TEXT NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."rented_books" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "copy_id" UUID NOT NULL REFERENCES "public"."book_copies"("id"),
        "user_id" UUID NOT NULL REFERENCES "public"."users"("id"),
        "rented_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."return_books" (
        "rent_id" UUID PRIMARY KEY REFERENCES "public"."rented_books"("id") ON DELETE CASCADE,
        "returned_at" TIMESTAMP NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."paid_rent_fines" (
        "rent_id" UUID PRIMARY KEY REFERENCES "public"."rented_books"("id") ON DELETE CASCADE,
        "fine_amount" INT NOT NULL,
        "paid_at" TIMESTAMP NOT NULL
      )
    `);

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users"("email")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "security"."roles"("name")');
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_permissions_name" ON "security"."permissions"("name")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_permissions_name"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_roles_name"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_users_email"');

    await queryRunner.query('DROP TABLE IF EXISTS "public"."paid_rent_fines"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."return_books"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."rented_books"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."book_copies"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."books_authors"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."books"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."storage"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."authors"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."cities"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."publishing_houses"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."categories"');

    await queryRunner.query('DROP TABLE IF EXISTS "security"."roles_x_permissions"');
    await queryRunner.query('DROP TABLE IF EXISTS "security"."roles_x_users"');
    await queryRunner.query('DROP TABLE IF EXISTS "security"."permissions"');
    await queryRunner.query('DROP TABLE IF EXISTS "security"."roles"');
    await queryRunner.query('DROP TABLE IF EXISTS "public"."users"');
    await queryRunner.query('DROP SCHEMA IF EXISTS "security" CASCADE');
  }
}
