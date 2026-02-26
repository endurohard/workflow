import TelegramBot from 'node-telegram-bot-api';
import { Job } from 'bullmq';

export interface TelegramJobData {
  chatId?: string;
  chatIds?: string[];
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  type?: 'text' | 'photo' | 'document';
  photo?: string;
  document?: string;
  caption?: string;
  keyboard?: {
    inline_keyboard?: Array<
      Array<{
        text: string;
        callback_data?: string;
        url?: string;
      }>
    >;
    keyboard?: Array<Array<string>>;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
  };
  replyToMessageId?: number;
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
}

export interface TelegramResult {
  success: boolean;
  messageId?: number;
  messageIds?: number[];
  error?: string;
}

export class TelegramWorker {
  private bot: TelegramBot;
  private botToken: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';

    if (!this.botToken) {
      console.warn('Telegram bot token not configured');
    }

    // Initialize Telegram bot (polling disabled for worker mode)
    this.bot = new TelegramBot(this.botToken, { polling: false });
  }

  /**
   * Process Telegram message job
   */
  public async process(job: Job<TelegramJobData>): Promise<TelegramResult> {
    const { data } = job;

    try {
      // Validate required fields
      if (!data.chatId && !data.chatIds) {
        throw new Error('Missing required Telegram fields: chatId or chatIds');
      }

      if (!data.text && data.type === 'text') {
        throw new Error('Missing required Telegram field: text');
      }

      // Handle multiple chat IDs (broadcast)
      if (data.chatIds && data.chatIds.length > 0) {
        const messageIds: number[] = [];

        for (const chatId of data.chatIds) {
          const result = await this.sendMessage(chatId, data);
          if (result.messageId) {
            messageIds.push(result.messageId);
          }
        }

        return {
          success: true,
          messageIds,
        };
      }

      // Handle single chat ID
      if (data.chatId) {
        return await this.sendMessage(data.chatId, data);
      }

      throw new Error('No valid chat ID provided');
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Send message to a single chat
   */
  private async sendMessage(
    chatId: string,
    data: TelegramJobData
  ): Promise<TelegramResult> {
    try {
      let message: any;

      // Prepare options
      const options: any = {};

      if (data.parseMode) {
        options.parse_mode = data.parseMode;
      }

      if (data.keyboard) {
        options.reply_markup = data.keyboard;
      }

      if (data.replyToMessageId) {
        options.reply_to_message_id = data.replyToMessageId;
      }

      if (data.disableWebPagePreview) {
        options.disable_web_page_preview = data.disableWebPagePreview;
      }

      if (data.disableNotification) {
        options.disable_notification = data.disableNotification;
      }

      // Send based on type
      switch (data.type) {
        case 'photo':
          if (!data.photo) {
            throw new Error('Photo URL required for photo type');
          }
          if (data.caption) {
            options.caption = data.caption;
          }
          message = await this.bot.sendPhoto(chatId, data.photo, options);
          break;

        case 'document':
          if (!data.document) {
            throw new Error('Document URL required for document type');
          }
          if (data.caption) {
            options.caption = data.caption;
          }
          message = await this.bot.sendDocument(chatId, data.document, options);
          break;

        case 'text':
        default:
          message = await this.bot.sendMessage(chatId, data.text, options);
          break;
      }

      console.log(`Telegram message sent successfully to ${chatId}: ${message.message_id}`);

      return {
        success: true,
        messageId: message.message_id,
      };
    } catch (error) {
      console.error(`Failed to send Telegram message to ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Verify bot token
   */
  public async verifyBot(): Promise<boolean> {
    try {
      const me = await this.bot.getMe();
      console.log(`Telegram bot verified: @${me.username}`);
      return true;
    } catch (error) {
      console.error('Telegram bot verification failed:', error);
      return false;
    }
  }
}
