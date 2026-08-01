import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalaryPaymentsService } from './salary-payments.service';
import { SalaryPaymentsController } from './salary-payments.controller';
import { SalaryPayment, SalaryPaymentSchema, User, UserSchema, SalaryConfig, SalaryConfigSchema, SalarySlip, SalarySlipSchema, Expense, ExpenseSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalaryPayment.name, schema: SalaryPaymentSchema },
      { name: User.name, schema: UserSchema },
      { name: SalaryConfig.name, schema: SalaryConfigSchema },
      { name: SalarySlip.name, schema: SalarySlipSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
  ],
  controllers: [SalaryPaymentsController],
  providers: [SalaryPaymentsService],
  exports: [SalaryPaymentsService, MongooseModule],
})
export class SalaryPaymentsModule {}
