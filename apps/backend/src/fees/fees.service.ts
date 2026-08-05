import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FeeStructure, FeeStructureDocument,
  Invoice, InvoiceDocument, InvoiceStatus,
  Enrollment, EnrollmentDocument,
  User, UserDocument, Course, CourseDocument,
  Income, IncomeDocument, IncomeSource,
  Role
} from '../schemas';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../schemas/notification.schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class FeesService {
  constructor(
    @InjectModel(FeeStructure.name) private readonly feeStructureModel: Model<FeeStructureDocument>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Income.name) private readonly incomeModel: Model<IncomeDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  // Helper to infer currency from student timezone or timezone string
  private getCurrencyForStudent(student: any): string {
    const tz = (student?.timezone || '').toUpperCase();
    if (tz.includes('KARACHI') || tz.includes('PKT') || tz.includes('PAKISTAN')) return 'PKR';
    if (tz.includes('LONDON') || tz.includes('GMT') || tz.includes('UK')) return 'GBP';
    if (tz.includes('PARIS') || tz.includes('BERLIN') || tz.includes('EUROPE')) return 'EUR';
    return 'USD'; // Default fallback
  }

  // --- Fee Structure Methods ---
  async createStructure(dto: CreateFeeStructureDto) {
    const existing = await this.feeStructureModel.findOne({ courseId: dto.courseId });
    if (existing) {
      return this.feeStructureModel.findByIdAndUpdate(existing._id, { $set: dto }, { new: true });
    }
    return this.feeStructureModel.create(dto);
  }

  async findAllStructures() {
    return this.feeStructureModel.find({ isActive: true }).populate('course', 'id title type');
  }

  async updateStructure(id: string, dto: any) {
    const struct = await this.feeStructureModel.findById(id);
    if (!struct) throw new NotFoundException('Fee structure not found');
    return this.feeStructureModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).populate('course', 'id title type');
  }

  async removeStructure(id: string) {
    const struct = await this.feeStructureModel.findById(id);
    if (!struct) throw new NotFoundException('Fee structure not found');
    return this.feeStructureModel.findByIdAndDelete(id);
  }

  // --- Invoice Methods ---
  async createInvoice(dto: CreateInvoiceDto, adminId?: string) {
    const student = await this.userModel.findById(dto.studentId);
    if (!student) throw new NotFoundException('Student not found');

    const currency = dto.currency || this.getCurrencyForStudent(student);

    const invoice = await this.invoiceModel.create({
      ...dto,
      currency,
      recordedBy: adminId,
      status: InvoiceStatus.PENDING,
    });

    return this.invoiceModel.findById(invoice._id)
      .populate('student', 'id name email timezone')
      .populate('course', 'id title');
  }

  async autoGenerateMonthlyInvoices(billingMonth: string, adminId?: string) {
    const students = await this.userModel.find({ role: Role.STUDENT, isActive: true }).populate('studentProfile');

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10); // Due in 10 days

    let generatedCount = 0;

    for (const student of students) {
      const studentId = student._id.toString();

      // Check if invoice already exists for this student & billing month
      const existing = await this.invoiceModel.findOne({ studentId, billingMonth });
      if (existing) continue;

      const profile = (student as any).studentProfile?.profile || {};
      const baseFee = Number(profile.monthlyFee || profile.monthlyFeeOverride || 50);
      const waiverPercent = Number(profile.feeWaiverPercent || 0);
      const netFee = Math.max(0, Math.round(baseFee * (1 - waiverPercent / 100)));
      const currency = profile.currency || this.getCurrencyForStudent(student);

      await this.invoiceModel.create({
        studentId,
        amount: netFee,
        currency,
        dueDate,
        status: InvoiceStatus.PENDING,
        billingMonth,
        recordedBy: adminId,
      });

      generatedCount++;
    }

    return { message: `Generated ${generatedCount} student fee invoices for billing month ${billingMonth}`, generatedCount };
  }

  async findAllInvoices(billingMonth?: string, status?: string, studentId?: string) {
    const filter: any = {};
    if (billingMonth) filter.billingMonth = billingMonth;
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;

    return this.invoiceModel.find(filter)
      .populate('student', 'id name email timezone studentId')
      .populate('course', 'id title type')
      .sort({ createdAt: -1 });
  }

  async recordPayment(invoiceId: string, amount: number, paymentMethod = 'CASH', referenceNumber?: string, notes?: string, adminId?: string) {
    const invoice = await this.invoiceModel.findById(invoiceId).populate('student').populate('course');
    if (!invoice) throw new NotFoundException('Invoice not found');

    const newPaidAmount = (invoice.paidAmount || 0) + amount;
    const isFullyPaid = newPaidAmount >= invoice.amount;

    const updated = await this.invoiceModel.findByIdAndUpdate(
      invoiceId,
      {
        $set: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
          paidDate: new Date(),
          paymentMethod,
          referenceNumber,
          notes,
          recordedBy: adminId,
        },
      },
      { new: true },
    ).populate('student', 'id name email').populate('course', 'id title');

    // Issue Notification to Student
    const student = (invoice as any).student;
    if (student?._id) {
      await this.notificationsService.createNotification(
        student._id.toString(),
        'Payment Confirmation Received',
        `Your payment of ${amount} ${invoice.currency} for ${((invoice as any).course as any)?.title || 'course'} has been recorded.`,
        NotificationType.SYSTEM,
        { invoiceId, billingMonth: invoice.billingMonth },
      );
    }

    // Auto-record Income entry
    try {
      if (adminId) {
        await this.incomeModel.create({
          title: `Student Fee - ${student?.name || 'Student'} (${invoice.billingMonth})`,
          amount,
          currency: invoice.currency || 'PKR',
          source: IncomeSource.FEES,
          date: new Date(),
          referenceId: invoice._id.toString(),
          recordedBy: adminId,
          description: `Fee collection for course: ${((invoice as any).course as any)?.title || 'N/A'}`,
        });
      }
    } catch (_) {}

    return updated;
  }

  async sendReminder(invoiceId: string) {
    const invoice = await this.invoiceModel.findById(invoiceId).populate('student').populate('course');
    if (!invoice) throw new NotFoundException('Invoice not found');

    const student = (invoice as any).student;
    const course = (invoice as any).course;

    if (!student || !student.email) {
      throw new NotFoundException('Student email not available for sending reminder.');
    }

    const dueDateStr = new Date(invoice.dueDate).toLocaleDateString();

    // 1. Send in-app notification
    await this.notificationsService.createNotification(
      student._id.toString(),
      'Fee Payment Reminder',
      `Reminder: Your fee of ${invoice.amount} ${invoice.currency} for ${course?.title} (${invoice.billingMonth}) is due on ${dueDateStr}.`,
      NotificationType.SYSTEM,
      { invoiceId },
    );

    // 2. Send email via Resend
    const emailSent = await this.emailService.sendFeeReminder(
      student.email,
      student.name,
      course?.title || 'Course',
      invoice.amount,
      invoice.currency,
      dueDateStr,
      invoice.billingMonth,
    );

    return {
      message: emailSent
        ? `Reminder email and in-app notification dispatched to ${student.email}`
        : `In-app notification sent to ${student.name}. Email delivery skipped (Resend key missing or failed).`,
      emailSent,
    };
  }

  async getRevenueSummary(billingMonth?: string) {
    const currentMonth = billingMonth || new Date().toISOString().slice(0, 7);
    const invoices = await this.invoiceModel.find({ billingMonth: currentMonth });

    const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
    const totalCollected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const pendingAmount = totalInvoiced - totalCollected;
    const paidCount = invoices.filter((i) => i.status === InvoiceStatus.PAID).length;
    const pendingCount = invoices.filter((i) => i.status === InvoiceStatus.PENDING).length;

    return {
      billingMonth: currentMonth,
      totalInvoiced,
      totalCollected,
      pendingAmount,
      paidCount,
      pendingCount,
      totalInvoices: invoices.length,
    };
  }
}
