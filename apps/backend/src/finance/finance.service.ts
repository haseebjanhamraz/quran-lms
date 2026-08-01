import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument, ExpenseStatus, Income, IncomeDocument, IncomeSource, Invoice, InvoiceDocument } from '../schemas';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Income.name) private readonly incomeModel: Model<IncomeDocument>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  async createExpense(dto: CreateExpenseDto, userId: string) {
    return this.expenseModel.create({
      ...dto,
      date: dto.date ? new Date(dto.date) : new Date(),
      createdBy: userId,
      status: ExpenseStatus.PENDING,
    });
  }

  async findAllExpenses(query: any = {}) {
    const filter: any = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.category && query.category !== 'ALL') {
      filter.category = query.category;
    }
    return this.expenseModel.find(filter).populate('createdBy', 'name email').populate('approvedBy', 'name email').sort({ createdAt: -1 });
  }

  async updateExpenseStatus(id: string, status: ExpenseStatus, userId: string) {
    const expense = await this.expenseModel.findById(id);
    if (!expense) throw new NotFoundException('Expense not found');

    expense.status = status;
    if (status === ExpenseStatus.APPROVED) {
      expense.approvedBy = userId;
    }
    return expense.save();
  }

  async recordIncome(title: string, amount: number, source: IncomeSource, recordedBy: string, currency = 'PKR', referenceId?: string, description?: string) {
    return this.incomeModel.create({
      title,
      amount,
      source,
      currency,
      date: new Date(),
      referenceId,
      recordedBy,
      description,
    });
  }

  async findAllIncome(query: any = {}) {
    const filter: any = {};
    if (query.source && query.source !== 'ALL') {
      filter.source = query.source;
    }
    return this.incomeModel.find(filter).populate('recordedBy', 'name email').sort({ createdAt: -1 });
  }

  async getDashboardStats() {
    const invoices = await this.invoiceModel.find();
    const expenses = await this.expenseModel.find({ status: ExpenseStatus.APPROVED });
    const incomes = await this.incomeModel.find();

    const totalFeeInvoiced = invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalFeeCollected = invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const totalPendingFees = totalFeeInvoiced - totalFeeCollected;

    const totalApprovedExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalManualIncome = incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const netProfitBalance = totalFeeCollected + totalManualIncome - totalApprovedExpenses;

    const recentExpenses = await this.expenseModel.find().limit(5).sort({ createdAt: -1 });
    const recentIncome = await this.incomeModel.find().limit(5).sort({ createdAt: -1 });

    return {
      totalFeeInvoiced,
      totalFeeCollected,
      totalPendingFees,
      totalApprovedExpenses,
      totalManualIncome,
      netProfitBalance,
      recentExpenses,
      recentIncome,
    };
  }
}
