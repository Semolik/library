import { MigrationInterface, QueryRunner } from 'typeorm';

export class RentedBooksDueDateAndLibrarySettings1747300000000 implements MigrationInterface {
  name = 'RentedBooksDueDateAndLibrarySettings1747300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."rented_books"
      ADD COLUMN IF NOT EXISTS "due_date" DATE NULL
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."library_app_settings" (
        "id" SMALLINT PRIMARY KEY DEFAULT 1 CHECK ("id" = 1),
        "default_loan_days" INTEGER NOT NULL DEFAULT 14
      )
    `);
    await queryRunner.query(`
      INSERT INTO "public"."library_app_settings" ("id", "default_loan_days")
      VALUES (1, 14)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."rented_books"
      DROP COLUMN IF EXISTS "due_date"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."library_app_settings"`);
  }
}
