import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentInquiry, StudentInquirySchema } from '../schemas';
import { StudentInquiriesController } from './student-inquiries.controller';
import { StudentInquiriesService } from './student-inquiries.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentInquiry.name, schema: StudentInquirySchema },
    ]),
  ],
  controllers: [StudentInquiriesController],
  providers: [StudentInquiriesService],
  exports: [StudentInquiriesService],
})
export class StudentInquiriesModule {}
