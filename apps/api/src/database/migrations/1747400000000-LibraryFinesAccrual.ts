import { MigrationInterface, QueryRunner } from 'typeorm';

export class LibraryFinesAccrual1747400000000 implements MigrationInterface {
  name = 'LibraryFinesAccrual1747400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."library_app_settings"
      ADD COLUMN IF NOT EXISTS "fine_per_overdue_day" INTEGER NOT NULL DEFAULT 10
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."library_app_settings"
      ADD COLUMN IF NOT EXISTS "fine_grace_days" INTEGER NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."rented_books"
      ADD COLUMN IF NOT EXISTS "accrued_fine_amount" INTEGER NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."rented_books"
      ADD COLUMN IF NOT EXISTS "accrued_fine_updated_at" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."rented_books"
      DROP COLUMN IF EXISTS "accrued_fine_updated_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."rented_books"
      DROP COLUMN IF EXISTS "accrued_fine_amount"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."library_app_settings"
      DROP COLUMN IF EXISTS "fine_grace_days"
    `);
    await queryRunner.query(`
      ALTER TABLE "public"."library_app_settings"
      DROP COLUMN IF EXISTS "fine_per_overdue_day"
    `);
  }
}
