import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env for CLI migration commands
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ================================================================
// TypeORM DataSource for CLI migration commands only.
// The app uses database.config.ts via ConfigService.
// ================================================================
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
