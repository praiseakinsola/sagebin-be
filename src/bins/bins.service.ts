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

  async notifyAllDevices(title: string, body: string, data?: any) {
    const tokens = await this.db.query.binFcmTokens.findMany();
    const uniqueTokens = Array.from(new Set(tokens.map((t) => t.token)));

    for (const token of uniqueTokens) {
      await this.firebaseService.sendNotification(token, title, body, data);
    }
  }

  async sendTestNotification(title?: string, body?: string) {
    await this.notifyAllDevices(
      title || 'Test Notification',
      body || 'This is a test notification from the Sagebin backend.',
      { type: 'test' },
    );
    return { success: true, message: 'Test notification sent to all devices' };
  }

  private async getOrCreateBin(serialNumber: string) {
    console.log(
      `[BinService] getOrCreateBin() called with serialNumber: "${serialNumber}"`,
    );

    console.log(`[BinService] Querying database for existing bin...`);
    let bin = await this.db.query.bins.findFirst({
      where: eq(schema.bins.serialNumber, serialNumber),
    });
    console.log(
      `[BinService] Query complete. Bin ${bin ? `found (id: ${bin.id})` : 'not found'}`,
    );

    if (!bin) {
      console.log(
        `[BinService] Creating new bin for serialNumber: "${serialNumber}"...`,
      );
      const [newBin] = await this.db
        .insert(schema.bins)
        .values({
          serialNumber,
          fillLevel: 0,
          status: 'close',
          lastOnlineAt: new Date(),
        })
        .returning();

      if (!newBin) {
        console.error(
          `[BinService] ERROR: Insert returned no rows for serialNumber: "${serialNumber}"`,
        );
        throw new Error(
          `Failed to create bin for serialNumber: "${serialNumber}"`,
        );
      }

      console.log(
        `[BinService] New bin created successfully:`,
        JSON.stringify(newBin, null, 2),
      );
      bin = newBin;
    } else {
      console.log(
        `[BinService] Returning existing bin:`,
        JSON.stringify(bin, null, 2),
      );
    }

    console.log(
      `[BinService] getOrCreateBin() complete. Returning bin id: ${bin.id}`,
    );
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

    // Send test notification to all devices
    await this.notifyAllDevices(
      'Fill Level Updated',
      `Bin ${serialNumber} fill level is now ${fillLevel}%`,
      {
        serialNumber,
        fillLevel: String(fillLevel),
        type: 'fill_level_updated',
      },
    );

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

    // Send test notification to all devices
    await this.notifyAllDevices(
      'Status Updated',
      `Bin ${serialNumber} status is now ${status}`,
      {
        serialNumber,
        status,
        type: 'status_updated',
      },
    );

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

    console.log(bin);

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
