import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * B3.3 — Creates the audit_logs table for operator document review history.
 *
 * Additive-only: no existing tables are modified.
 * Stores every approve/reject decision with FK to documents and users.
 */
export class CreateAuditLogs1700000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
        "action"      VARCHAR       NOT NULL,
        "document_id" UUID          NOT NULL REFERENCES "reservation_documents"("id") ON DELETE CASCADE,
        "operator_id" UUID          NOT NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "reason"      TEXT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_document"
        ON "audit_logs" ("document_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_operator"
        ON "audit_logs" ("operator_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
