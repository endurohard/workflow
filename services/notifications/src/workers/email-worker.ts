import nodemailer, { Transporter } from 'nodemailer';
import { Job } from 'bullmq';

export interface EmailJobData {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailWorker {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.SMTP_FROM || 'noreply@workflow.com';

    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
          }
        : undefined,
    });
  }

  /**
   * Process email job
   */
  public async process(job: Job<EmailJobData>): Promise<EmailResult> {
    const { data } = job;

    try {
      // Validate required fields
      if (!data.to || !data.subject) {
        throw new Error('Missing required email fields: to, subject');
      }

      // Prepare email options
      const mailOptions = {
        from: data.from || this.defaultFrom,
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        text: data.body,
        html: data.html,
        attachments: data.attachments,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      console.log(`Email sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Verify SMTP connection
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}
