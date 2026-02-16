import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@libsql/client';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

export const DrizzleProvider: FactoryProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const client = createClient({
      url: configService.get<string>('TURSO_DATABASE_URL')!,
      authToken: configService.get<string>('TURSO_AUTH_TOKEN'),
    });
    return drizzle(client, { schema });
  },
};

export type DrizzleDB = LibSQLDatabase<typeof schema>;
