import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the users table with RBAC role enum.
 * Uses IF NOT EXISTS so re-running is safe.
 */
export class CreateUsersTable1700000001000 implements MigrationInterface {
  name = 'CreateUsersTable1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create role enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role_enum AS ENUM ('USER', 'OPERATOR', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
        "email"         VARCHAR(255)  NOT NULL,
        "password_hash" TEXT          NOT NULL,
        "full_name"     VARCHAR(120)  NOT NULL,
        "role"          user_role_enum NOT NULL DEFAULT 'USER',
        "phone"         VARCHAR(30),
        "is_active"     BOOLEAN       NOT NULL DEFAULT TRUE,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum;`);
  }
}
