import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateStripeWebhookLogsTable1700000006000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stripe_webhook_logs',
        columns: [
          {
            name: 'event_id',
            type: 'varchar',
            length: '100',
            isPrimary: true,
            comment: 'Stripe evt_* ID — globally unique, used as idempotency key',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '80',
            isNullable: false,
          },
          {
            name: 'processed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Index to quickly find unprocessed events (monitoring / alerting)
    await queryRunner.createIndex(
      'stripe_webhook_logs',
      new TableIndex({
        name: 'idx_webhook_logs_processed',
        columnNames: ['processed', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'stripe_webhook_logs',
      'idx_webhook_logs_processed',
    );
    await queryRunner.dropTable('stripe_webhook_logs');
  }
}
