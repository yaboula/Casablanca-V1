const net = require('net');

function parseHostPortFromDatabaseUrl(connectionString) {
  const url = new URL(connectionString);
  return {
    label: 'Postgres',
    host: url.hostname,
    port: Number(url.port || 5432),
    hint: 'Run "npm run docker:dev" and "npm run db:e2e:prepare" before the Playwright smoke.',
  };
}

function parseHostPortFromRedisUrl(connectionString) {
  const url = new URL(connectionString);
  return {
    label: 'Redis',
    host: url.hostname,
    port: Number(url.port || 6379),
    hint: 'Run "npm run docker:dev" before the Playwright smoke.',
  };
}

function checkTcp({ label, host, port, hint }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    const done = (err) => {
      socket.removeAllListeners();
      socket.destroy();
      if (err) {
        reject(
          new Error(
            `${label} is not reachable at ${host}:${port}. ${hint} Original error: ${err.message}`,
          ),
        );
      } else {
        resolve();
      }
    };

    socket.setTimeout(3000);
    socket.once('connect', () => done());
    socket.once('timeout', () => done(new Error('connection timed out')));
    socket.once('error', (err) => done(err));
  });
}

async function main() {
  const checks = [];

  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://nexus:nexus_secret@localhost:5433/nexus_e2e_db';
  checks.push(checkTcp(parseHostPortFromDatabaseUrl(databaseUrl)));

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  checks.push(checkTcp(parseHostPortFromRedisUrl(redisUrl)));

  await Promise.all(checks);
  console.log('[preflight:e2e] Postgres and Redis are reachable.');
}

main().catch((err) => {
  console.error(`[preflight:e2e] ${err.message}`);
  process.exit(1);
});
