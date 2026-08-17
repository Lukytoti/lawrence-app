import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

async function start() {
  console.log('🚀 Starting local embedded PostgreSQL server on port 5432...');

  const dbDir = path.join(process.cwd(), '.pgdata');

  const pg = new (EmbeddedPostgres as any)({
    databaseDir: dbDir,
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    persistent: true,
  });

  try {
    await pg.initialise();
  } catch (err) {
    // Directory already initialized
  }
  await pg.start();
  console.log('✅ PostgreSQL is now running on postgresql://postgres:postgres@localhost:5432/lawrence_app?schema=public');
}

start().catch((err) => {
  console.error('❌ Embedded Postgres startup error:', err);
  process.exit(1);
});
