import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AIReport, AIReportSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIReport.name, schema: AIReportSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService, MongooseModule],
})
export class ReportsModule {}
