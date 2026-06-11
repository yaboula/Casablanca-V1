import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservationPricingSnapshot1700000013000
  implements MigrationInterface
{
  name = 'AddReservationPricingSnapshot1700000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
        ADD COLUMN IF NOT EXISTS "daily_rate_eur_cents_snapshot" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "subtotal_eur_cents" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "total_due_now_eur_cents" INTEGER NOT NULL DEFAULT 1000,
        ADD COLUMN IF NOT EXISTS "charged_day_units_x2" INTEGER NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS "full_days" INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "extra_hours" NUMERIC(6, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "extra_billing_type" VARCHAR(20) NOT NULL DEFAULT 'NONE',
        ADD COLUMN IF NOT EXISTS "pricing_policy_version" VARCHAR(80) NOT NULL DEFAULT 'legacy',
        ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR'
    `);

    await queryRunner.query(`
      UPDATE "reservations" r
      SET
        "daily_rate_eur_cents_snapshot" = CASE
          WHEN r."total_days" > 0 THEN FLOOR(r."total_price_eur_cents" / r."total_days")
          ELSE r."total_price_eur_cents"
        END,
        "subtotal_eur_cents" = r."total_price_eur_cents",
        "total_due_now_eur_cents" = r."deposit_eur_cents",
        "charged_day_units_x2" = GREATEST(r."total_days", 1) * 2,
        "full_days" = GREATEST(r."total_days", 1),
        "extra_hours" = 0,
        "extra_billing_type" = 'NONE',
        "pricing_policy_version" = 'legacy',
        "currency" = 'EUR'
      WHERE r."subtotal_eur_cents" = 0
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_reservations_pricing_policy_version"
        ON "reservations" ("pricing_policy_version")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reservations_pricing_policy_version"
    `);

    await queryRunner.query(`
      ALTER TABLE "reservations"
        DROP COLUMN IF EXISTS "currency",
        DROP COLUMN IF EXISTS "pricing_policy_version",
        DROP COLUMN IF EXISTS "extra_billing_type",
        DROP COLUMN IF EXISTS "extra_hours",
        DROP COLUMN IF EXISTS "full_days",
        DROP COLUMN IF EXISTS "charged_day_units_x2",
        DROP COLUMN IF EXISTS "total_due_now_eur_cents",
        DROP COLUMN IF EXISTS "subtotal_eur_cents",
        DROP COLUMN IF EXISTS "daily_rate_eur_cents_snapshot"
    `);
  }
}
