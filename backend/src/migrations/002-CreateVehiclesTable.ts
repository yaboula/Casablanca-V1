import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the vehicles table with PostgreSQL text[] for imageUrls and features.
 */
export class CreateVehiclesTable1700000002000 implements MigrationInterface {
  name = 'CreateVehiclesTable1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE vehicle_category_enum AS ENUM ('SEDAN', 'SUV', 'LUXURY', 'COMPACT');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE vehicle_status_enum AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE transmission_enum AS ENUM ('AUTOMATIC', 'MANUAL');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicles" (
        "id"                      UUID                  NOT NULL DEFAULT gen_random_uuid(),
        "brand"                   VARCHAR(80)           NOT NULL,
        "model"                   VARCHAR(120)          NOT NULL,
        "category"                vehicle_category_enum NOT NULL,
        "price_per_day_eur_cents" INTEGER               NOT NULL,
        "image_url"               VARCHAR(500)          NOT NULL,
        "image_urls"              TEXT[]                NOT NULL DEFAULT '{}',
        "transmission"            transmission_enum     NOT NULL,
        "seats"                   SMALLINT              NOT NULL,
        "luggage_count"           SMALLINT              NOT NULL,
        "features"                TEXT[]                NOT NULL DEFAULT '{}',
        "status"                  vehicle_status_enum   NOT NULL DEFAULT 'AVAILABLE',
        "created_at"              TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
        "updated_at"              TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_vehicles" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vehicles_category" ON "vehicles" ("category");
      CREATE INDEX IF NOT EXISTS "idx_vehicles_status"   ON "vehicles" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles";`);
    await queryRunner.query(`DROP TYPE IF EXISTS vehicle_category_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS vehicle_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS transmission_enum;`);
  }
}
