import { TelegramWorker } from '../workers/telegram-worker';
import TelegramBot from 'node-telegram-bot-api';

// Mock node-telegram-bot-api
jest.mock('node-telegram-bot-api');

describe('TelegramWorker', () => {
  let telegramWorker: TelegramWorker;
  let mockSendMessage: jest.Mock;
  let mockSendPhoto: jest.Mock;
  let mockSendDocument: jest.Mock;

  beforeEach(() => {
    mockSendMessage = jest.fn().mockResolvedValue({ message_id: 123 });
    mockSendPhoto = jest.fn().mockResolvedValue({ message_id: 124 });
    mockSendDocument = jest.fn().mockResolvedValue({ message_id: 125 });

    (TelegramBot as jest.Mock).mockImplementation(() => ({
      sendMessage: mockSendMessage,
      sendPhoto: mockSendPhoto,
      sendDocument: mockSendDocument,
    }));

    telegramWorker = new TelegramWorker();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Process Telegram Message Job', () => {
    it('should send text message successfully', async () => {
      const jobData = {
        chatId: '123456789',
        text: 'Test message',
      };

      const result = await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledWith('123456789', 'Test message', {});

      expect(result).toEqual({
        success: true,
        messageId: 123,
      });
    });

    it('should send message with markdown formatting', async () => {
      const jobData = {
        chatId: '123456789',
        text: '*Bold* and _italic_ text',
        parseMode: 'Markdown',
      };

      await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123456789',
        '*Bold* and _italic_ text',
        expect.objectContaining({
          parse_mode: 'Markdown',
        })
      );
    });

    it('should send message with HTML formatting', async () => {
      const jobData = {
        chatId: '123456789',
        text: '<b>Bold</b> and <i>italic</i> text',
        parseMode: 'HTML',
      };

      await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123456789',
        '<b>Bold</b> and <i>italic</i> text',
        expect.objectContaining({
          parse_mode: 'HTML',
        })
      );
    });

    it('should send message with inline keyboard', async () => {
      const jobData = {
        chatId: '123456789',
        text: 'Choose an option',
        keyboard: {
          inline_keyboard: [
            [
              { text: 'Option 1', callback_data: 'opt1' },
              { text: 'Option 2', callback_data: 'opt2' },
            ],
          ],
        },
      };

      await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123456789',
        'Choose an option',
        expect.objectContaining({
          reply_markup: {
            inline_keyboard: expect.any(Array),
          },
        })
      );
    });

    it('should send photo', async () => {
      const jobData = {
        chatId: '123456789',
        type: 'photo',
        photo: 'https://example.com/photo.jpg',
        caption: 'Test photo',
      };

      const result = await telegramWorker.process({ data: jobData } as any);

      expect(mockSendPhoto).toHaveBeenCalledWith(
        '123456789',
        'https://example.com/photo.jpg',
        expect.objectContaining({
          caption: 'Test photo',
        })
      );

      expect(result.messageId).toBe(124);
    });

    it('should send document', async () => {
      const jobData = {
        chatId: '123456789',
        type: 'document',
        document: 'https://example.com/doc.pdf',
        caption: 'Test document',
      };

      const result = await telegramWorker.process({ data: jobData } as any);

      expect(mockSendDocument).toHaveBeenCalledWith(
        '123456789',
        'https://example.com/doc.pdf',
        expect.objectContaining({
          caption: 'Test document',
        })
      );

      expect(result.messageId).toBe(125);
    });

    it('should handle missing required fields', async () => {
      const jobData = {
        text: 'Test message',
      };

      await expect(telegramWorker.process({ data: jobData } as any)).rejects.toThrow(
        'Missing required Telegram fields'
      );
    });

    it('should handle Telegram API errors', async () => {
      mockSendMessage.mockRejectedValue(new Error('Telegram API error'));

      const jobData = {
        chatId: '123456789',
        text: 'Test message',
      };

      await expect(telegramWorker.process({ data: jobData } as any)).rejects.toThrow(
        'Telegram API error'
      );
    });

    it('should support reply to message', async () => {
      const jobData = {
        chatId: '123456789',
        text: 'Reply message',
        replyToMessageId: 100,
      };

      await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123456789',
        'Reply message',
        expect.objectContaining({
          reply_to_message_id: 100,
        })
      );
    });

    it('should disable web page preview', async () => {
      const jobData = {
        chatId: '123456789',
        text: 'Message with link https://example.com',
        disableWebPagePreview: true,
      };

      await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123456789',
        'Message with link https://example.com',
        expect.objectContaining({
          disable_web_page_preview: true,
        })
      );
    });

    it('should disable notifications', async () => {
      const jobData = {
        chatId: '123456789',
        text: 'Silent message',
        disableNotification: true,
      };

      await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123456789',
        'Silent message',
        expect.objectContaining({
          disable_notification: true,
        })
      );
    });

    it('should send to multiple chats', async () => {
      const jobData = {
        chatIds: ['123', '456', '789'],
        text: 'Broadcast message',
      };

      await telegramWorker.process({ data: jobData } as any);

      expect(mockSendMessage).toHaveBeenCalledTimes(3);
      expect(mockSendMessage).toHaveBeenCalledWith('123', 'Broadcast message', {});
      expect(mockSendMessage).toHaveBeenCalledWith('456', 'Broadcast message', {});
      expect(mockSendMessage).toHaveBeenCalledWith('789', 'Broadcast message', {});
    });
  });

  describe('Configuration', () => {
    it('should initialize with bot token', () => {
      expect(TelegramBot).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
    });
  });
});
