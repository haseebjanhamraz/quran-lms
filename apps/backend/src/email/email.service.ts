import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'Quran LMS <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.warn(`[Resend Email Mock] RESEND_API_KEY not set. Email to ${to} with subject "${subject}" was logged.`);
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        this.logger.error(`Failed to send email via Resend: ${JSON.stringify(errorData)}`);
        return false;
      }

      this.logger.log(`Successfully sent email to ${to} via Resend.`);
      return true;
    } catch (err) {
      this.logger.error(`Error sending email to ${to}:`, err);
      return false;
    }
  }

  async sendFeeReminder(
    studentEmail: string,
    studentName: string,
    courseTitle: string,
    amount: number,
    currency: string,
    dueDate: string,
    billingMonth: string,
  ): Promise<boolean> {
    const subject = `Fee Payment Reminder — Quran Academy (${billingMonth})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
        <h2 style="color: #0f766e; text-align: center;">Quran Academy</h2>
        <h3 style="color: #334155;">Monthly Fee Payment Reminder</h3>
        <p>Assalamu Alaikum <strong>${studentName}</strong>,</p>
        <p>This is a friendly reminder that your monthly course fee for <strong>${courseTitle}</strong> (${billingMonth}) is due for payment.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0f766e;">
          <p style="margin: 5px 0;"><strong>Course:</strong> ${courseTitle}</p>
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${amount.toLocaleString()} ${currency}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
          <p style="margin: 5px 0;"><strong>Billing Month:</strong> ${billingMonth}</p>
        </div>
        <p>Please clear the fee through our Cash Gateway or contact administration for payment details.</p>
        <br />
        <p style="color: #64748b; font-size: 12px;">BarakAllahu Feekum,<br />Quran LMS Administration</p>
      </div>
    `;

    return this.sendEmail(studentEmail, subject, html);
  }
}
