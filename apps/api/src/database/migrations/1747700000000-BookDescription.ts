import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookDescription1747700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."books"
      ADD COLUMN IF NOT EXISTS "description" TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."books" DROP COLUMN IF EXISTS "description"
    `);
  }
}
