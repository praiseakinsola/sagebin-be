import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  const serialNumber = '123456';

  console.log(`Seeding bin with serial number: ${serialNumber}`);

  // 1. Create Bin
  const [bin] = await db
    .insert(schema.bins)
    .values({
      serialNumber,
      fillLevel: 85,
      status: 'close',
      lastOnlineAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.bins.serialNumber,
      set: {
        fillLevel: 85,
        status: 'close',
        lastOnlineAt: new Date(),
      },
    })
    .returning();

  console.log(`Bin created/updated with ID: ${bin.id}`);

  // 2. Clear existing history for this bin (optional, but good for a fresh seed)
  // Clean up if we want a fresh start, otherwise just append
  await db
    .delete(schema.binFillLevelHistory)
    .where(eq(schema.binFillLevelHistory.binId, bin.id));
  await db
    .delete(schema.binStatusHistory)
    .where(eq(schema.binStatusHistory.binId, bin.id));

  // 3. Seed Fill Level History (Last 24 hours)
  const fillLevelEntries: any[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    fillLevelEntries.push({
      binId: bin.id,
      fillLevel: Math.floor(Math.random() * 100),
      timestamp,
    });
  }
  await db.insert(schema.binFillLevelHistory).values(fillLevelEntries);
  console.log(
    `Inserted ${fillLevelEntries.length} fill level history entries.`,
  );

  // 4. Seed Status History
  const statusEntries = [
    {
      binId: bin.id,
      status: 'open' as const,
      timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      binId: bin.id,
      status: 'close' as const,
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      binId: bin.id,
      status: 'open' as const,
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      binId: bin.id,
      status: 'close' as const,
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  ];
  await db.insert(schema.binStatusHistory).values(statusEntries);
  console.log(`Inserted ${statusEntries.length} status history entries.`);

  console.log('Seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
