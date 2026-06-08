import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleLicensePlateAndFixAuditLogFk1700000010000
  implements MigrationInterface
{
  name = "AddVehicleLicensePlateAndFixAuditLogFk1700000010000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "license_plate" VARCHAR(20)
    `);

    await queryRunner.query(`
      WITH numbered AS (
        SELECT
          id,
          CONCAT('UNASSIGNED-', LPAD(ROW_NUMBER() OVER (ORDER BY created_at, id)::text, 4, '0')) AS generated_plate
        FROM "vehicles"
        WHERE "license_plate" IS NULL
      )
      UPDATE "vehicles" v
      SET "license_plate" = numbered.generated_plate
      FROM numbered
      WHERE v.id = numbered.id
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ALTER COLUMN "license_plate" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_vehicles_license_plate"
      ON "vehicles" ("license_plate")
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_operator_id_fkey"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "audit_logs_operator_id_fkey"
      FOREIGN KEY ("operator_id")
      REFERENCES "users"("id")
      ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_operator_id_fkey"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "audit_logs_operator_id_fkey"
      FOREIGN KEY ("operator_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_vehicles_license_plate"
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "license_plate"
    `);
  }
}
