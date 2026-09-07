import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) { }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || process.env.RESEND_API_KEY;
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'Ain Ul Quran <onboarding@resend.dev>';

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
    const subject = `Fee Payment Reminder — Ain Ul Quran (${billingMonth})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
        <h2 style="color: #0f766e; text-align: center;">Ain Ul Quran</h2>
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
        <p style="color: #64748b; font-size: 12px;">BarakAllahu Feekum,<br />Ain Ul Quran Administration</p>
      </div>
    `;

    return this.sendEmail(studentEmail, subject, html);
  }

  async sendStudentAdmissionEmail(
    studentEmail: string,
    studentName: string,
    loginPassword?: string,
    studentId?: number | string,
  ): Promise<boolean> {
    const subject = `Welcome to Ain Ul Quran — Admission Confirmed`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; margin: 0; font-size: 24px;">Ain Ul Quran</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Learning Management System</p>
        </div>
        <h3 style="color: #1e293b; margin-top: 0;">Assalamu Alaikum wa Rahmatullah,</h3>
        <p style="color: #334155; line-height: 1.6;">
          Dear <strong>${studentName}</strong>, we are pleased to inform you that your admission at <strong>Ain Ul Quran</strong> has been successfully confirmed.
        </p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0f766e;">
          <h4 style="margin: 0 0 10px 0; color: #0f766e;">Your Account Details</h4>
          ${studentId ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Student ID:</strong> ${studentId}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Registered Email:</strong> ${studentEmail}</p>
          ${loginPassword ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${loginPassword}</span></p>` : ''}
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Please log in to your student portal to review your weekly class schedule and course curriculum. If you have any questions or require assistance, our administration team is always here to support you.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          BarakAllahu Feekum,<br />
          <strong>Ain Ul Quran Administration</strong>
        </p>
      </div>
    `;

    return this.sendEmail(studentEmail, subject, html);
  }

  async sendTeacherAdmissionEmail(
    teacherEmail: string,
    teacherName: string,
    loginPassword?: string,
    employeeId?: string,
  ): Promise<boolean> {
    const subject = `Welcome to Ain Ul Quran — Faculty Onboarding Confirmed`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; margin: 0; font-size: 24px;">Ain Ul Quran</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Faculty &amp; Teaching Portal</p>
        </div>
        <h3 style="color: #1e293b; margin-top: 0;">Assalamu Alaikum wa Rahmatullah,</h3>
        <p style="color: #334155; line-height: 1.6;">
          Dear Ustadh / Ustadha <strong>${teacherName}</strong>, welcome to the teaching faculty of <strong>Ain Ul Quran</strong>. Your teacher profile has been registered in the system.
        </p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0f766e;">
          <h4 style="margin: 0 0 10px 0; color: #0f766e;">Your Faculty Credentials</h4>
          ${employeeId ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Employee ID:</strong> ${employeeId}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Portal Email:</strong> ${teacherEmail}</p>
          ${loginPassword ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${loginPassword}</span></p>` : ''}
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          You can now log in to the faculty portal to access your weekly timetable, classroom dashboard, and student rosters.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          Jazakumullahu Khairan,<br />
          <strong>Ain Ul Quran Administration</strong>
        </p>
      </div>
    `;

    return this.sendEmail(teacherEmail, subject, html);
  }

  async sendClassStartedEmail(
    studentEmail: string,
    studentName: string,
    teacherName: string,
    courseName: string,
    classTime: string,
  ): Promise<boolean> {
    const subject = `Your Quran Class Has Started — ${courseName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; margin: 0; font-size: 24px;">Ain Ul Quran</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Virtual Classroom Notification</p>
        </div>
        <h3 style="color: #1e293b; margin-top: 0;">Assalamu Alaikum <strong>${studentName}</strong>,</h3>
        <p style="color: #334155; line-height: 1.6;">
          Your teacher <strong>${teacherName}</strong> has just started your class for <strong>${courseName}</strong>.
        </p>
        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>Status:</strong> Class is now LIVE</p>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>Course:</strong> ${courseName}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>Teacher:</strong> ${teacherName}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>Scheduled Time:</strong> ${classTime}</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Please log into your student portal immediately to join your ongoing session.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          BarakAllahu Feekum,<br />
          <strong>Ain Ul Quran Administration</strong>
        </p>
      </div>
    `;

    return this.sendEmail(studentEmail, subject, html);
  }
}
