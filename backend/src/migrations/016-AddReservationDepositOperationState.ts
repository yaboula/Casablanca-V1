import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationDepositOperationState1700000016000
  implements MigrationInterface
{
  name = "AddReservationDepositOperationState1700000016000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD COLUMN IF NOT EXISTS "deposit_status" varchar(32) NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "deposit_captured_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "deposit_last_failure_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "deposit_last_failure_reason" text NULL,
      ADD COLUMN IF NOT EXISTS "deposit_refund_status" varchar(32) NOT NULL DEFAULT 'NOT_APPLICABLE',
      ADD COLUMN IF NOT EXISTS "deposit_refund_attempted_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "deposit_refund_failure_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "deposit_refund_failure_reason" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      DROP COLUMN IF EXISTS "deposit_refund_failure_reason",
      DROP COLUMN IF EXISTS "deposit_refund_failure_at",
      DROP COLUMN IF EXISTS "deposit_refund_attempted_at",
      DROP COLUMN IF EXISTS "deposit_refund_status",
      DROP COLUMN IF EXISTS "deposit_last_failure_reason",
      DROP COLUMN IF EXISTS "deposit_last_failure_at",
      DROP COLUMN IF EXISTS "deposit_captured_at",
      DROP COLUMN IF EXISTS "deposit_status"
    `);
  }
}
