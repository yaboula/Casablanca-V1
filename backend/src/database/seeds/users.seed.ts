/**
 * Seed: Dev test users
 * Creates one user per role with predictable credentials for local development.
 *
 * Run:  docker exec nexus_backend node dist/database/seeds/users.seed.js
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const DB_URL =
  process.env.DATABASE_URL ??
  'postgresql://nexus:nexus@nexus_postgres:5432/nexus_db';

const TEST_USERS = [
  {
    email: 'admin@nexus.dev',
    password: 'Admin1234!',
    fullName: 'Admin NEXUS',
    role: 'ADMIN',
  },
  {
    email: 'operator@nexus.dev',
    password: 'Operator1234!',
    fullName: 'Operador CMN',
    role: 'OPERATOR',
  },
  {
    email: 'user@nexus.dev',
    password: 'User1234!',
    fullName: 'Cliente Demo',
    role: 'USER',
  },
];

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: DB_URL,
    entities: [],
    synchronize: false,
  });

  await ds.initialize();
  console.log('🌱  Seeding test users…');

  for (const u of TEST_USERS) {
    const existing = await ds.query(
      'SELECT id FROM users WHERE email = $1',
      [u.email],
    );

    if (existing.length > 0) {
      // Update role in case it was changed
      await ds.query(
        'UPDATE users SET role = $1 WHERE email = $2',
        [u.role, u.email],
      );
      console.log(`  ↻  ${u.email}  →  role updated to ${u.role}`);
      continue;
    }

    const hash = await bcrypt.hash(u.password, 10);
    await ds.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, phone, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL, true, NOW(), NOW())`,
      [u.email, hash, u.fullName, u.role],
    );
    console.log(`  ✓  ${u.email}  (${u.role})  created`);
  }

  await ds.destroy();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
