import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  onModuleInit() {
    // console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? ''));
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? ''),
      ),
    });
    this.logger.log('Firebase Admin initialized successfully.');
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
