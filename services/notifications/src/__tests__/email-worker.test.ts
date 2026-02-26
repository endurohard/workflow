import { EmailWorker } from '../workers/email-worker';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailWorker', () => {
  let emailWorker: EmailWorker;
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    emailWorker = new EmailWorker();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Process Email Job', () => {
    it('should send email successfully', async () => {
      const jobData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        html: '<p>Test Body</p>',
      };

      const result = await emailWorker.process({ data: jobData } as any);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test Body',
        html: '<p>Test Body</p>',
      });

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
      });
    });

    it('should handle missing required fields', async () => {
      const jobData = {
        subject: 'Test Subject',
      };

      await expect(emailWorker.process({ data: jobData } as any)).rejects.toThrow(
        'Missing required email fields'
      );
    });

    it('should handle email sending errors', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      const jobData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      await expect(emailWorker.process({ data: jobData } as any)).rejects.toThrow('SMTP error');
    });

    it('should support multiple recipients', async () => {
      const jobData = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        body: 'Test Body',
      };

      await emailWorker.process({ data: jobData } as any);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
        })
      );
    });

    it('should support cc and bcc', async () => {
      const jobData = {
        to: 'test@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      await emailWorker.process({ data: jobData } as any);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: 'bcc@example.com',
        })
      );
    });

    it('should support attachments', async () => {
      const jobData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        attachments: [
          {
            filename: 'test.pdf',
            path: '/path/to/test.pdf',
          },
        ],
      };

      await emailWorker.process({ data: jobData } as any);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'test.pdf',
            }),
          ]),
        })
      );
    });

    it('should use default sender if not specified', async () => {
      const jobData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      await emailWorker.process({ data: jobData } as any);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
        })
      );
    });

    it('should support custom sender', async () => {
      const jobData = {
        from: 'custom@example.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      await emailWorker.process({ data: jobData } as any);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });
  });

  describe('Configuration', () => {
    it('should initialize with SMTP configuration', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: expect.any(String),
          port: expect.any(Number),
        })
      );
    });
  });
});
