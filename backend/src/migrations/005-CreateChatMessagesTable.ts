import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatMessagesTable1700000005000 implements MigrationInterface {
  name = 'CreateChatMessagesTable1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
        "user_id"        UUID         NOT NULL,
        "reservation_id" UUID,
        "text"           TEXT         NOT NULL,
        "sender"         VARCHAR(10)  NOT NULL DEFAULT 'user',
        "status"         VARCHAR(10)  NOT NULL DEFAULT 'sent',
        "timestamp"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "fk_chat_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_chat_reservation"
          FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_chat_reservation_id" ON "chat_messages" ("reservation_id");
      CREATE INDEX IF NOT EXISTS "idx_chat_user_id"        ON "chat_messages" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_chat_timestamp"      ON "chat_messages" ("timestamp");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages";`);
  }
}
