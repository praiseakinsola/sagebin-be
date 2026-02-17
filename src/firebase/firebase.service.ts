import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  onModuleInit() {
    // TODO: Move service account path to configuration or environment variables
    const serviceAccountPath = path.join(
      process.cwd(),
      'src',
      'config',
      'firebase-service-account.json',
    );

    if (fs.existsSync(serviceAccountPath)) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      this.logger.log('Firebase Admin initialized successfully.');
    } else {
      this.logger.warn(
        `Firebase Service Account file not found at ${serviceAccountPath}. FCM notifications will not work.`,
      );
    }
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: any,
  ) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase App not initialized. Skipping notification.');
      return;
    }

    try {
      await admin.messaging().send({
        notification: { title, body },
        data: data || {},
        token: token,
      });
      this.logger.log(`Notification sent to token: ${token}`);
    } catch (error) {
      // TODO: Handle invalid tokens by removing them from the database
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }
}
