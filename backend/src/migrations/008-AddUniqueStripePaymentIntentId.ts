import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * BUG-03 fix: Add a partial unique index on stripe_payment_intent_id
 * to prevent two reservations from accidentally sharing the same PaymentIntent.
 *
 * Partial: only WHERE stripe_payment_intent_id IS NOT NULL,
 * because most rows start with NULL before Stripe PI is created.
 */
export class AddUniqueStripePaymentIntentId1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_reservations_stripe_pi_id"
        ON "reservations" ("stripe_payment_intent_id")
        WHERE "stripe_payment_intent_id" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_reservations_stripe_pi_id";
    `);
  }
}
