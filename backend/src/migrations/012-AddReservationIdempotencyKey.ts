import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservationIdempotencyKey1700000012000
  implements MigrationInterface
{
  name = 'AddReservationIdempotencyKey1700000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(100)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_reservations_user_idempotency"
      ON "reservations" ("user_id", "idempotency_key")
      WHERE "idempotency_key" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_reservations_user_idempotency"
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations" DROP COLUMN IF EXISTS "idempotency_key"
    `);
  }
}
