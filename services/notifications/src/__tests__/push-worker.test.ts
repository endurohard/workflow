import { PushWorker } from '../workers/push-worker';
import * as admin from 'firebase-admin';

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
  messaging: jest.fn(),
}));

describe('PushWorker', () => {
  let pushWorker: PushWorker;
  let mockSend: jest.Mock;
  let mockSendMulticast: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn().mockResolvedValue('message-id-123');
    mockSendMulticast = jest.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });

    (admin.messaging as jest.Mock).mockReturnValue({
      send: mockSend,
      sendMulticast: mockSendMulticast,
    });

    pushWorker = new PushWorker();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Process Push Notification Job', () => {
    it('should send push notification to single device', async () => {
      const jobData = {
        token: 'device-token-123',
        title: 'Test Notification',
        body: 'Test Body',
      };

      const result = await pushWorker.process({ data: jobData } as any);

      expect(mockSend).toHaveBeenCalledWith({
        token: 'device-token-123',
        notification: {
          title: 'Test Notification',
          body: 'Test Body',
        },
      });

      expect(result).toEqual({
        success: true,
        messageId: 'message-id-123',
      });
    });

    it('should send push notification to multiple devices', async () => {
      const jobData = {
        tokens: ['token-1', 'token-2'],
        title: 'Test Notification',
        body: 'Test Body',
      };

      const result = await pushWorker.process({ data: jobData } as any);

      expect(mockSendMulticast).toHaveBeenCalledWith({
        tokens: ['token-1', 'token-2'],
        notification: {
          title: 'Test Notification',
          body: 'Test Body',
        },
      });

      expect(result).toEqual({
        success: true,
        successCount: 2,
        failureCount: 0,
      });
    });

    it('should include data payload', async () => {
      const jobData = {
        token: 'device-token-123',
        title: 'Test Notification',
        body: 'Test Body',
        data: {
          orderId: '12345',
          type: 'order_update',
        },
      };

      await pushWorker.process({ data: jobData } as any);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            orderId: '12345',
            type: 'order_update',
          },
        })
      );
    });

    it('should support Android-specific options', async () => {
      const jobData = {
        token: 'device-token-123',
        title: 'Test Notification',
        body: 'Test Body',
        android: {
          priority: 'high',
          ttl: 3600,
        },
      };

      await pushWorker.process({ data: jobData } as any);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          android: {
            priority: 'high',
            ttl: 3600,
          },
        })
      );
    });

    it('should support iOS-specific options', async () => {
      const jobData = {
        token: 'device-token-123',
        title: 'Test Notification',
        body: 'Test Body',
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      await pushWorker.process({ data: jobData } as any);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          apns: expect.any(Object),
        })
      );
    });

    it('should handle missing required fields', async () => {
      const jobData = {
        title: 'Test Notification',
      };

      await expect(pushWorker.process({ data: jobData } as any)).rejects.toThrow(
        'Missing required push notification fields'
      );
    });

    it('should handle Firebase errors', async () => {
      mockSend.mockRejectedValue(new Error('Firebase error'));

      const jobData = {
        token: 'device-token-123',
        title: 'Test Notification',
        body: 'Test Body',
      };

      await expect(pushWorker.process({ data: jobData } as any)).rejects.toThrow('Firebase error');
    });

    it('should handle partial failures in multicast', async () => {
      mockSendMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          { success: false, error: new Error('Invalid token') },
        ],
      });

      const jobData = {
        tokens: ['token-1', 'token-2'],
        title: 'Test Notification',
        body: 'Test Body',
      };

      const result = await pushWorker.process({ data: jobData } as any);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });

    it('should support topic-based notifications', async () => {
      const jobData = {
        topic: 'news',
        title: 'Breaking News',
        body: 'Important update',
      };

      await pushWorker.process({ data: jobData } as any);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'news',
        })
      );
    });

    it('should support condition-based notifications', async () => {
      const jobData = {
        condition: "'news' in topics || 'updates' in topics",
        title: 'Update',
        body: 'New content available',
      };

      await pushWorker.process({ data: jobData } as any);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: "'news' in topics || 'updates' in topics",
        })
      );
    });
  });

  describe('Configuration', () => {
    it('should initialize Firebase Admin SDK', () => {
      expect(admin.initializeApp).toHaveBeenCalled();
    });
  });
});
