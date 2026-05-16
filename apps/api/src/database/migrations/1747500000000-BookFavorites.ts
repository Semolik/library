import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookFavorites1747500000000 implements MigrationInterface {
  name = 'BookFavorites1747500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."book_favorites" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "book_id" UUID NOT NULL REFERENCES "public"."books"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_book_favorites_user_book" UNIQUE ("user_id", "book_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_book_favorites_user" ON "public"."book_favorites" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."book_favorites"`);
  }
}
