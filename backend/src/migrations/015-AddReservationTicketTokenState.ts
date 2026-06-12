import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationTicketTokenState1700000015000
  implements MigrationInterface
{
  name = "AddReservationTicketTokenState1700000015000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD COLUMN IF NOT EXISTS "ticket_token_version" INTEGER NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD COLUMN IF NOT EXISTS "ticket_revoked_at" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      DROP COLUMN IF EXISTS "ticket_revoked_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations"
      DROP COLUMN IF EXISTS "ticket_token_version"
    `);
  }
}
