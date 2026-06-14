import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationDeskCollectionState1718400000000
  implements MigrationInterface
{
  name = "AddReservationDeskCollectionState1718400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      ADD COLUMN IF NOT EXISTS "desk_collection_status" varchar(32) NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "desk_collection_method" varchar(32) NULL,
      ADD COLUMN IF NOT EXISTS "desk_collection_reference" varchar(120) NULL,
      ADD COLUMN IF NOT EXISTS "desk_collection_received_at" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "desk_collection_amount_eur_cents" integer NULL
    `);

    await queryRunner.query(`
      UPDATE "reservations"
      SET
        "desk_collection_status" = CASE
          WHEN COALESCE("total_price_eur_cents", 0) - COALESCE("deposit_eur_cents", 0) <= 0
            THEN 'NOT_REQUIRED'
          ELSE 'PENDING'
        END,
        "desk_collection_method" = NULL,
        "desk_collection_reference" = NULL,
        "desk_collection_received_at" = NULL,
        "desk_collection_amount_eur_cents" = NULL
      WHERE "desk_collection_status" IS NULL
         OR "desk_collection_status" = 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
      DROP COLUMN IF EXISTS "desk_collection_amount_eur_cents",
      DROP COLUMN IF EXISTS "desk_collection_received_at",
      DROP COLUMN IF EXISTS "desk_collection_reference",
      DROP COLUMN IF EXISTS "desk_collection_method",
      DROP COLUMN IF EXISTS "desk_collection_status"
    `);
  }
}
