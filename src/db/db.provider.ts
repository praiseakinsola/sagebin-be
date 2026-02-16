import { FactoryProvider } from '@nestjs/common';
import { createClient } from '@libsql/client';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

export const DrizzleProvider: FactoryProvider = {
  provide: DRIZZLE,
  useFactory: () => {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  },
};

export type DrizzleDB = LibSQLDatabase<typeof schema>;
