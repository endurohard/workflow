import * as admin from 'firebase-admin';
import { Job } from 'bullmq';

export interface PushJobData {
  token?: string;
  tokens?: string[];
  topic?: string;
  condition?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  android?: {
    priority?: 'normal' | 'high';
    ttl?: number;
    collapseKey?: string;
    restrictedPackageName?: string;
  };
  apns?: {
    payload?: {
      aps?: {
        badge?: number;
        sound?: string;
        contentAvailable?: boolean;
        category?: string;
      };
    };
  };
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  successCount?: number;
  failureCount?: number;
  errors?: Array<{ index: number; error: string }>;
}

export class PushWorker {
  private initialized: boolean = false;

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize with service account or default credentials
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (process.env.FIREBASE_PROJECT_ID) {
        // Use application default credentials
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } else {
        console.warn('Firebase not configured, push notifications will not work');
        return;
      }

      this.initialized = true;
      console.log('Firebase Admin SDK initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }

  /**
   * Process push notification job
   */
  public async process(job: Job<PushJobData>): Promise<PushResult> {
    const { data } = job;

    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }

      // Validate required fields
      if (!data.token && !data.tokens && !data.topic && !data.condition) {
        throw new Error('Missing required push notification fields: token, tokens, topic, or condition');
      }

      if (!data.title || !data.body) {
        throw new Error('Missing required push notification fields: title and body');
      }

      // Prepare message
      const message: any = {
        notification: {
          title: data.title,
          body: data.body,
          imageUrl: data.imageUrl,
        },
        data: data.data,
      };

      // Add platform-specific options
      if (data.android) {
        message.android = {
          priority: data.android.priority || 'high',
          ttl: data.android.ttl,
          collapseKey: data.android.collapseKey,
          restrictedPackageName: data.android.restrictedPackageName,
        };
      }

      if (data.apns) {
        message.apns = data.apns;
      }

      // Send to single device
      if (data.token) {
        message.token = data.token;
        const messageId = await admin.messaging().send(message);

        console.log(`Push notification sent successfully: ${messageId}`);

        return {
          success: true,
          messageId,
        };
      }

      // Send to multiple devices
      if (data.tokens) {
        message.tokens = data.tokens;
        const response = await admin.messaging().sendMulticast(message);

        console.log(
          `Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`
        );

        const errors = response.responses
          .map((resp, idx) => ({
            index: idx,
            error: resp.error?.message || '',
            success: resp.success,
          }))
          .filter((r) => !r.success)
          .map((r) => ({ index: r.index, error: r.error }));

        return {
          success: response.failureCount === 0,
          successCount: response.successCount,
          failureCount: response.failureCount,
          errors: errors.length > 0 ? errors : undefined,
        };
      }

      // Send to topic
      if (data.topic) {
        message.topic = data.topic;
        const messageId = await admin.messaging().send(message);

        console.log(`Push notification sent to topic ${data.topic}: ${messageId}`);

        return {
          success: true,
          messageId,
        };
      }

      // Send with condition
      if (data.condition) {
        message.condition = data.condition;
        const messageId = await admin.messaging().send(message);

        console.log(`Push notification sent with condition: ${messageId}`);

        return {
          success: true,
          messageId,
        };
      }

      throw new Error('No valid target specified for push notification');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error; // Re-throw to trigger retry mechanism
    }
  }
}
