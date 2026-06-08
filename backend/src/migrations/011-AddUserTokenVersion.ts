import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTokenVersion1700000011000 implements MigrationInterface {
  name = 'AddUserTokenVersion1700000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "token_version"
    `);
  }
}
