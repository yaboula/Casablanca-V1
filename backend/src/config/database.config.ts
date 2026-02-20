import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    ssl: config.get<boolean>('DATABASE_SSL')
      ? { rejectUnauthorized: false }
      : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: false,   // NEVER auto-run in production
    synchronize: false,     // STRICTLY FORBIDDEN in all environments
    logging: config.get<string>('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
    extra: {
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    },
  }),
};
