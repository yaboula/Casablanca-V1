import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates reservations table with all 6 status states including AWAITING_CAPTURE
 * (Saga pattern intermediate state).
 */
export class CreateReservationsTable1700000003000 implements MigrationInterface {
  name = 'CreateReservationsTable1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE reservation_status_enum AS ENUM (
          'PENDING_DEPOSIT',
          'AWAITING_CAPTURE',
          'CONFIRMED',
          'IN_PROGRESS',
          'COMPLETED',
          'CANCELLED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE pickup_location_enum AS ENUM ('CMN_T1', 'CMN_T2');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservations" (
        "id"                        UUID                      NOT NULL DEFAULT gen_random_uuid(),
        "user_id"                   UUID                      NOT NULL,
        "vehicle_id"                UUID                      NOT NULL,
        "pickup_date"               TIMESTAMPTZ               NOT NULL,
        "return_date"               TIMESTAMPTZ               NOT NULL,
        "total_days"                INTEGER                   NOT NULL,
        "total_price_eur_cents"     INTEGER                   NOT NULL,
        "deposit_eur_cents"         INTEGER                   NOT NULL DEFAULT 1000,
        "pickup_location"           pickup_location_enum      NOT NULL,
        "status"                    reservation_status_enum   NOT NULL DEFAULT 'PENDING_DEPOSIT',
        "stripe_payment_intent_id"  TEXT,
        "stripe_client_secret"      TEXT,
        "qr_code_hash"              TEXT,
        "customer_name"             VARCHAR(120),
        "customer_phone"            VARCHAR(30),
        "created_at"                TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
        "updated_at"                TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_reservations_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_reservations_vehicle"
          FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT
      );
    `);

    // Indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_reservations_user_id"   ON "reservations" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_reservations_vehicle_id" ON "reservations" ("vehicle_id");
      CREATE INDEX IF NOT EXISTS "idx_reservations_status"    ON "reservations" ("status");
      -- Composite for availability overlap queries (pickup_date, return_date, status)
      CREATE INDEX IF NOT EXISTS "idx_reservations_overlap"
        ON "reservations" ("vehicle_id", "pickup_date", "return_date")
        WHERE status IN ('PENDING_DEPOSIT', 'AWAITING_CAPTURE', 'CONFIRMED', 'IN_PROGRESS');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations";`);
    await queryRunner.query(`DROP TYPE IF EXISTS reservation_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS pickup_location_enum;`);
  }
}
