import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandOperatorAuditLogs1700000014000
  implements MigrationInterface
{
  name = "ExpandOperatorAuditLogs1700000014000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "resource_type" VARCHAR NOT NULL DEFAULT 'DOCUMENT'
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "reservation_id" UUID
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "before_status" VARCHAR
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "after_status" VARCHAR
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "metadata" JSONB
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "document_id" DROP NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_reservation"
      ON "audit_logs" ("reservation_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_audit_reservation"
    `);

    await queryRunner.query(`
      DELETE FROM "audit_logs"
      WHERE "document_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "document_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      DROP COLUMN IF EXISTS "metadata"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      DROP COLUMN IF EXISTS "after_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      DROP COLUMN IF EXISTS "before_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      DROP COLUMN IF EXISTS "reservation_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      DROP COLUMN IF EXISTS "resource_type"
    `);
  }
}
