import { MigrationInterface, QueryRunner } from 'typeorm';

export class LibrarySchemaAndMinio1710000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`
      ALTER TABLE "public"."users"
      ADD COLUMN IF NOT EXISTS "middle_name" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50)
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
      INSERT INTO "security"."roles_x_users" ("user_id", "role_id")
      SELECT "user_id", "role_id" FROM "security"."user_role"
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "security"."roles_x_permissions" ("role_id", "permission_id")
      SELECT "role_id", "permission_id" FROM "security"."permission_role"
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "security"."user_role" ("user_id", "role_id")
      SELECT "user_id", "role_id" FROM "security"."roles_x_users"
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "security"."permission_role" ("permission_id", "role_id")
      SELECT "permission_id", "role_id" FROM "security"."roles_x_permissions"
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."users"
      DROP COLUMN IF EXISTS "middle_name",
      DROP COLUMN IF EXISTS "phone"
    `);

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
  }
}
