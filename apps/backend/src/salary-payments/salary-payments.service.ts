import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SalaryPayment, SalaryPaymentDocument,
  User, UserDocument, Role,
  SalaryConfig, SalaryConfigDocument,
  SalarySlip, SalarySlipDocument,
  Expense, ExpenseDocument, ExpenseCategory, ExpenseStatus
} from '../schemas';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';

@Injectable()
export class SalaryPaymentsService {
  constructor(
    @InjectModel(SalaryPayment.name) private readonly salaryPaymentModel: Model<SalaryPaymentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SalaryConfig.name) private readonly salaryConfigModel: Model<SalaryConfigDocument>,
    @InjectModel(SalarySlip.name) private readonly salarySlipModel: Model<SalarySlipDocument>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(createDto: CreateSalaryPaymentDto, adminId?: string) {
    const teacher = await this.userModel.findById(createDto.teacherId);
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Teacher not found');
    }

    const created = await this.salaryPaymentModel.create({
      ...createDto,
      currency: createDto.currency || 'PKR',
      recordedBy: adminId,
      paymentDate: new Date(),
    });

    // Auto-create an approved Expense record under category SALARY
    try {
      if (adminId) {
        await this.expenseModel.create({
          title: `Teacher Salary - ${teacher.name} (${createDto.month})`,
          amount: createDto.amount,
          currency: createDto.currency || 'PKR',
          category: ExpenseCategory.SALARY,
          date: new Date(),
          createdBy: adminId,
          approvedBy: adminId,
          status: ExpenseStatus.APPROVED,
          description: `Salary disbursement (${createDto.payType || 'MONTHLY'}). Payment via ${createDto.paymentMethod || 'CASH'}. Notes: ${createDto.notes || 'None'}`,
        });
      }
    } catch (_) {}

    return this.salaryPaymentModel.findById(created._id).populate('teacher', 'id name email');
  }

  async findAll(month?: string, teacherId?: string) {
    const filter: any = {};
    if (month) filter.month = month;
    if (teacherId) filter.teacherId = teacherId;

    return this.salaryPaymentModel
      .find(filter)
      .populate('teacher', 'id name email')
      .sort({ paymentDate: -1 });
  }

  // --- Salary Configurations ---
  async upsertConfig(teacherId: string, data: Partial<SalaryConfig>) {
    const teacher = await this.userModel.findById(teacherId);
    if (!teacher) throw new NotFoundException('Teacher not found');

    const config = await this.salaryConfigModel.findOneAndUpdate(
      { teacherId },
      { $set: { ...data, teacherId } },
      { new: true, upsert: true }
    );
    return config;
  }

  async findAllConfigs() {
    const teachers = await this.userModel.find({ role: Role.TEACHER, isActive: true }).populate('teacherProfile');
    const configs = await this.salaryConfigModel.find();
    const configMap = new Map(configs.map((c) => [c.teacherId.toString(), c]));

    return teachers.map((t: any) => {
      const existingConfig = configMap.get(t._id.toString());
      const tp = t.teacherProfile?.profile;
      return {
        teacher: { id: t._id, name: t.name, email: t.email, employeeId: tp?.employeeId },
        config: existingConfig || {
          teacherId: t._id,
          baseSalary: tp?.salary || 35000,
          payType: tp?.payType || 'MONTHLY',
          hourlyRate: tp?.hourlyRate || 0,
          country: tp?.country || 'Pakistan',
          currency: tp?.currency || 'PKR',
          housingAllowance: 0,
          transportAllowance: 0,
          medicalAllowance: 0,
          otherAllowances: 0,
          taxDeduction: 0,
          otherDeductions: 0,
        },
      };
    });
  }

  // --- Salary Slips ---
  async generateSlip(salaryPaymentId: string, generatedBy?: string) {
    const payment: any = await this.salaryPaymentModel.findById(salaryPaymentId).populate('teacher');
    if (!payment) throw new NotFoundException('Salary payment record not found');

    const existingSlip = await this.salarySlipModel.findOne({ salaryPaymentId });
    if (existingSlip) return existingSlip;

    const teacherId = payment.teacher?._id || payment.teacherId;
    const config = await this.salaryConfigModel.findOne({ teacherId });

    const baseSalary = config?.baseSalary || payment.amount;
    const housing = config?.housingAllowance || 0;
    const transport = config?.transportAllowance || 0;
    const medical = config?.medicalAllowance || 0;
    const otherAllow = config?.otherAllowances || 0;
    const grossSalary = baseSalary + housing + transport + medical + otherAllow;

    const tax = config?.taxDeduction || 0;
    const otherDed = config?.otherDeductions || 0;
    const totalDeductions = tax + otherDed;

    const netSalary = grossSalary - totalDeductions;
    const monthClean = (payment.month || '').replace('-', '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const slipNumber = `SLP-${monthClean}-${randCode}`;

    return this.salarySlipModel.create({
      salaryPaymentId,
      slipNumber,
      generatedBy,
      breakdown: {
        payType: payment.payType || config?.payType || 'MONTHLY',
        currency: payment.currency || config?.currency || 'PKR',
        country: config?.country || 'Pakistan',
        hoursWorked: payment.hoursWorked || 0,
        hourlyRate: payment.hourlyRate || config?.hourlyRate || 0,
        baseSalary,
        housingAllowance: housing,
        transportAllowance: transport,
        medicalAllowance: medical,
        otherAllowances: otherAllow,
        grossSalary,
        taxDeduction: tax,
        otherDeductions: otherDed,
        totalDeductions,
        netSalary: netSalary > 0 ? netSalary : payment.amount,
      },
    });
  }

  async getSummary(month: string) {
    const payments = await this.salaryPaymentModel.find({ month });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const teachers = await this.userModel.find({ role: Role.TEACHER, isActive: true }).populate('teacherProfile');
    const totalExpected = teachers.reduce((sum, t: any) => sum + (t.teacherProfile?.profile?.salary || 35000), 0);

    return {
      month,
      totalPaid,
      totalExpected,
      totalTeachers: teachers.length,
      paidCount: new Set(payments.map(p => p.teacherId.toString())).size,
      pendingCount: Math.max(0, teachers.length - new Set(payments.map(p => p.teacherId.toString())).size),
    };
  }

  async remove(id: string) {
    const payment = await this.salaryPaymentModel.findByIdAndDelete(id);
    if (!payment) throw new NotFoundException('Salary payment record not found');
    return { message: 'Payment record removed' };
  }
}
