import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthorHasPhoto1747600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."authors"
      ADD COLUMN IF NOT EXISTS "has_photo" BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."authors" DROP COLUMN IF EXISTS "has_photo"
    `);
  }
}
