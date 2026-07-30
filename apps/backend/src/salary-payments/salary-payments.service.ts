import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalaryPayment, SalaryPaymentDocument, User, UserDocument, Role } from '../schemas';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';

@Injectable()
export class SalaryPaymentsService {
  constructor(
    @InjectModel(SalaryPayment.name) private readonly salaryPaymentModel: Model<SalaryPaymentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createDto: CreateSalaryPaymentDto, adminId?: string) {
    const teacher = await this.userModel.findById(createDto.teacherId);
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Teacher not found');
    }

    const created = await this.salaryPaymentModel.create({
      ...createDto,
      recordedBy: adminId,
      paymentDate: new Date(),
    });

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

  async getSummary(month: string) {
    const payments = await this.salaryPaymentModel.find({ month });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const teachers = await this.userModel.find({ role: Role.TEACHER, isActive: true }).populate('teacherProfile');
    const totalExpected = teachers.reduce((sum, t: any) => sum + (t.teacherProfile?.profile?.salary || 0), 0);

    return {
      month,
      totalPaid,
      totalExpected,
      pendingCount: teachers.length - new Set(payments.map(p => p.teacherId.toString())).size,
    };
  }

  async remove(id: string) {
    const payment = await this.salaryPaymentModel.findByIdAndDelete(id);
    if (!payment) throw new NotFoundException('Salary payment record not found');
    return { message: 'Payment record removed' };
  }
}
