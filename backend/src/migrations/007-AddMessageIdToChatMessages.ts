import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * BUG-01 fix: Add `message_id` column to `chat_messages`.
 *
 * The entity declares `messageId` (mapped to `message_id`) with a UNIQUE
 * constraint for client-side idempotency, but migration 005 never created
 * the column — any INSERT with a non-null messageId would fail.
 */
export class AddMessageIdToChatMessages1700000007000 implements MigrationInterface {
  name = "AddMessageIdToChatMessages1700000007000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column only if it doesn't exist (safe for re-runs)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'chat_messages' AND column_name = 'message_id'
        ) THEN
          ALTER TABLE "chat_messages"
            ADD COLUMN "message_id" VARCHAR UNIQUE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "message_id";
    `);
  }
}
