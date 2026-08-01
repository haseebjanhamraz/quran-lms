import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import {
  FeeStructure, FeeStructureSchema,
  Invoice, InvoiceSchema,
  Enrollment, EnrollmentSchema,
  User, UserSchema,
  Course, CourseSchema,
  Income, IncomeSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeeStructure.name, schema: FeeStructureSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Income.name, schema: IncomeSchema },
    ]),
  ],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService, MongooseModule],
})
export class FeesModule {}
