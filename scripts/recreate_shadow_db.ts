import { Client } from 'pg';

async function recreateShadowDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
  });

  await client.connect();
  console.log('Connected to PostgreSQL server.');

  await client.query('DROP DATABASE IF EXISTS lawrence_app_shadow;');
  console.log('Dropped lawrence_app_shadow database if exists.');

  await client.query('CREATE DATABASE lawrence_app_shadow;');
  console.log('Created fresh lawrence_app_shadow database.');

  await client.end();
}

recreateShadowDb().catch((err) => {
  console.error('Failed to recreate shadow DB:', err);
  process.exit(1);
});
