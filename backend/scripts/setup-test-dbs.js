const { Client } = require("pg");

const DEFAULT_ADMIN_URL =
  "postgresql://nexus:nexus_secret@localhost:5433/postgres";

const adminUrl = process.env.TEST_DB_ADMIN_URL || DEFAULT_ADMIN_URL;
const databases = ["nexus_db", "nexus_test_db", "nexus_e2e_db"];

function quoteIdentifier(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe database name: ${name}`);
  }
  return `"${name}"`;
}

async function main() {
  const client = new Client({ connectionString: adminUrl });

  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Cannot connect to Postgres at ${adminUrl}. ` +
        `Start Docker infrastructure first: npm run docker:dev. ` +
        `Original error: ${err.message}`,
    );
  }

  try {
    for (const dbName of databases) {
      const existing = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName],
      );

      if (existing.rowCount === 0) {
        await client.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
        console.log(`created database: ${dbName}`);
      } else {
        console.log(`database already exists: ${dbName}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
