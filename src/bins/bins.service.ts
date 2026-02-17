import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { LibSQLDatabase } from 'drizzle-orm/libsql';

@Injectable()
export class BinsService {
  constructor(
    @Inject('DB_CONNECTION')
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
      .set({ fillLevel, lastUpdated: new Date() })
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
      .set({ status, lastUpdated: new Date() })
      .where(eq(schema.bins.id, bin.id));

    await this.db.insert(schema.binStatusHistory).values({
      binId: bin.id,
      status,
    });

    return { success: true, serialNumber, status };
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

    return bin;
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
