import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates reservation_documents table.
 * fileKey stored (never the URL) — presigned URLs generated on read.
 * Unique partial index: only one APPROVED doc per (reservation, type).
 */
export class CreateReservationDocumentsTable1700000004000 implements MigrationInterface {
  name = 'CreateReservationDocumentsTable1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE document_type_enum AS ENUM ('PASSPORT', 'DRIVING_LICENSE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE document_status_enum AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservation_documents" (
        "id"               UUID                  NOT NULL DEFAULT gen_random_uuid(),
        "user_id"          UUID                  NOT NULL,
        "reservation_id"   UUID                  NOT NULL,
        "type"             document_type_enum    NOT NULL,
        "file_key"         VARCHAR(500)          NOT NULL,
        "status"           document_status_enum  NOT NULL DEFAULT 'PENDING_REVIEW',
        "rejection_reason" VARCHAR(300),
        "reviewed_by"      UUID,
        "reviewed_at"      TIMESTAMPTZ,
        "created_at"       TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_reservation_documents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_docs_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_docs_reservation"
          FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_docs_reviewed_by"
          FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_docs_reservation_id" ON "reservation_documents" ("reservation_id");
      CREATE INDEX IF NOT EXISTS "idx_docs_status"         ON "reservation_documents" ("status");
      -- Enforce: only ONE approved doc per (reservation, type)
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_docs_approved_unique"
        ON "reservation_documents" ("reservation_id", "type")
        WHERE status = 'APPROVED';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reservation_documents";`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS document_status_enum;`);
  }
}
