import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../db/db.provider';

@Injectable()
export class BinsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  private async getOrCreateBin(serialNumber: string) {
    let bin = await this.db.query.bins.findFirst({
      where: eq(schema.bins.serialNumber, serialNumber),
    });

    if (!bin) {
      const [newBin] = await this.db
        .insert(schema.bins)
        .values({
          serialNumber,
          fillLevel: 0,
          status: 'open',
          lastOnlineAt: new Date(),
        })
        .returning();
      bin = newBin;
    }

    return bin;
  }

  async setFillLevel(serialNumber: string, fillLevel: number) {
    const bin = await this.getOrCreateBin(serialNumber);

    await this.db
      .update(schema.bins)
      .set({ fillLevel, lastUpdated: new Date(), lastOnlineAt: new Date() })
      .where(eq(schema.bins.id, bin.id));

    await this.db.insert(schema.binFillLevelHistory).values({
      binId: bin.id,
      fillLevel,
    });

    return { success: true, serialNumber, fillLevel };
  }

  async setStatus(serialNumber: string, status: 'open' | 'close') {
    const bin = await this.getOrCreateBin(serialNumber);

    await this.db
      .update(schema.bins)
      .set({ status, lastUpdated: new Date(), lastOnlineAt: new Date() })
      .where(eq(schema.bins.id, bin.id));

    await this.db.insert(schema.binStatusHistory).values({
      binId: bin.id,
      status,
    });

    return { success: true, serialNumber, status };
  }

  async setOnline(serialNumber: string) {
    const bin = await this.getOrCreateBin(serialNumber);

    await this.db
      .update(schema.bins)
      .set({ lastOnlineAt: new Date() })
      .where(eq(schema.bins.id, bin.id));

    return { success: true, serialNumber, lastOnlineAt: new Date() };
  }

  async getBin(serialNumber: string) {
    const bin = await this.db.query.bins.findFirst({
      where: eq(schema.bins.serialNumber, serialNumber),
    });

    if (!bin) {
      throw new NotFoundException(
        `Bin with serial number ${serialNumber} not found`,
      );
    }

    const isOnline =
      bin.lastOnlineAt &&
      new Date().getTime() - bin.lastOnlineAt.getTime() < 60000;

    return {
      ...bin,
      isOnline: !!isOnline,
    };
  }

  async getFillLevelTimeline(serialNumber: string) {
    const bin = await this.getBin(serialNumber);

    return this.db.query.binFillLevelHistory.findMany({
      where: eq(schema.binFillLevelHistory.binId, bin.id),
      orderBy: [desc(schema.binFillLevelHistory.timestamp)],
    });
  }

  async getStatusTimeline(serialNumber: string) {
    const bin = await this.getBin(serialNumber);

    return this.db.query.binStatusHistory.findMany({
      where: eq(schema.binStatusHistory.binId, bin.id),
      orderBy: [desc(schema.binStatusHistory.timestamp)],
    });
  }
}
