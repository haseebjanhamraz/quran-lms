import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalaryPaymentsService } from './salary-payments.service';
import { SalaryPaymentsController } from './salary-payments.controller';
import { SalaryPayment, SalaryPaymentSchema, User, UserSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalaryPayment.name, schema: SalaryPaymentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SalaryPaymentsController],
  providers: [SalaryPaymentsService],
  exports: [SalaryPaymentsService, MongooseModule],
})
export class SalaryPaymentsModule {}
