import { db } from '../src/lib/db';

async function createShadowDb() {
  try {
    await db.$executeRawUnsafe(`CREATE DATABASE lawrence_app_shadow;`);
    console.log('✅ Shadow database lawrence_app_shadow created successfully.');
  } catch (err: any) {
    if (err.message.includes('already exists')) {
      console.log('ℹ️ Shadow database lawrence_app_shadow already exists.');
    } else {
      console.error('❌ Error creating shadow DB:', err.message);
    }
  } finally {
    await db.$disconnect();
  }
}

createShadowDb();
