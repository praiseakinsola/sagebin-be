import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, and, gte } from 'drizzle-orm';
import * as schema from '../db/schema';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../db/db.provider';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class BinsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
    private readonly firebaseService: FirebaseService,
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

    // TODO: Make the percentage threshold (80) configurable via environment variables or database settings
    if (fillLevel > 80) {
      const tokens = await this.db.query.binFcmTokens.findMany({
        where: eq(schema.binFcmTokens.binId, bin.id),
      });

      for (const { token } of tokens) {
        await this.firebaseService.sendNotification(
          token,
          'Bin Alert!',
          `Bin ${serialNumber} is ${fillLevel}% full. Please empty it soon.`,
          { serialNumber, fillLevel: String(fillLevel) },
        );
      }
    }

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
    const bin = await this.getOrCreateBin(serialNumber);

    const isOnline =
      bin.lastOnlineAt &&
      new Date().getTime() - bin.lastOnlineAt.getTime() < 60_000;

    return {
      ...bin,
      isOnline: !!isOnline,
    };
  }

  async getFillLevelTimeline(serialNumber: string, days?: number) {
    const bin = await this.getBin(serialNumber);

    const whereClause = [eq(schema.binFillLevelHistory.binId, bin.id)];
    if (days) {
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - days);
      whereClause.push(gte(schema.binFillLevelHistory.timestamp, cutOffDate));
    }

    return this.db.query.binFillLevelHistory.findMany({
      where: and(...whereClause),
      orderBy: [desc(schema.binFillLevelHistory.timestamp)],
    });
  }

  async getStatusTimeline(serialNumber: string, days?: number) {
    const bin = await this.getBin(serialNumber);

    const whereClause = [eq(schema.binStatusHistory.binId, bin.id)];
    if (days) {
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - days);
      whereClause.push(gte(schema.binStatusHistory.timestamp, cutOffDate));
    }

    return this.db.query.binStatusHistory.findMany({
      where: and(...whereClause),
      orderBy: [desc(schema.binStatusHistory.timestamp)],
    });
  }

  async registerFcmToken(serialNumber: string, token: string) {
    const bin = await this.getOrCreateBin(serialNumber);

    // Check if token already exists for this bin
    const existing = await this.db.query.binFcmTokens.findFirst({
      where: and(
        eq(schema.binFcmTokens.binId, bin.id),
        eq(schema.binFcmTokens.token, token),
      ),
    });

    if (!existing) {
      await this.db.insert(schema.binFcmTokens).values({
        binId: bin.id,
        token: token,
      });
    }

    return { success: true, serialNumber, token };
  }
}
