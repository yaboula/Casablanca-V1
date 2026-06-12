import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationDepositOperationState016
  implements MigrationInterface
{
  name = "AddReservationDepositOperationState016";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD COLUMN "deposit_status" varchar(32) NOT NULL DEFAULT 'PENDING',
      ADD COLUMN "deposit_captured_at" TIMESTAMPTZ NULL,
      ADD COLUMN "deposit_last_failure_at" TIMESTAMPTZ NULL,
      ADD COLUMN "deposit_last_failure_reason" text NULL,
      ADD COLUMN "deposit_refund_status" varchar(32) NOT NULL DEFAULT 'NOT_APPLICABLE',
      ADD COLUMN "deposit_refund_attempted_at" TIMESTAMPTZ NULL,
      ADD COLUMN "deposit_refund_failure_at" TIMESTAMPTZ NULL,
      ADD COLUMN "deposit_refund_failure_reason" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      DROP COLUMN "deposit_refund_failure_reason",
      DROP COLUMN "deposit_refund_failure_at",
      DROP COLUMN "deposit_refund_attempted_at",
      DROP COLUMN "deposit_refund_status",
      DROP COLUMN "deposit_last_failure_reason",
      DROP COLUMN "deposit_last_failure_at",
      DROP COLUMN "deposit_captured_at",
      DROP COLUMN "deposit_status"
    `);
  }
}
