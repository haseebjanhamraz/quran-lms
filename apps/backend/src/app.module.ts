import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ClassSessionsModule } from './class-sessions/class-sessions.module';
import { SupervisorAssignmentsModule } from './supervisor-assignments/supervisor-assignments.module';
import { LivekitModule } from './livekit/livekit.module';
import { BullModule } from '@nestjs/bullmq';
import { RecordingsModule } from './recordings/recordings.module';
import { LocalStorageModule } from './local-storage/local-storage.module';
import { ClassReviewsModule } from './class-reviews/class-reviews.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { TranscriptModule } from './transcript/transcript.module';
import { AIAnalysisModule } from './ai-analysis/ai-analysis.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PermissionsModule } from './permissions/permissions.module';
import { StudentFeedbackModule } from './student-feedback/student-feedback.module';
import { SalaryPaymentsModule } from './salary-payments/salary-payments.module';
import { EmailModule } from './email/email.module';
import { FeesModule } from './fees/fees.module';
import { FinanceModule } from './finance/finance.module';
import { SupportModule } from './support/support.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../.env'),
      ],
      validate,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120,
    }]),
    UsersModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    ClassSessionsModule,
    SupervisorAssignmentsModule,
    LivekitModule,
    RecordingsModule,
    LocalStorageModule,
    ClassReviewsModule,
    AuditLogsModule,
    TranscriptModule,
    AIAnalysisModule,
    ReportsModule,
    NotificationsModule,
    PermissionsModule,
    StudentFeedbackModule,
    SalaryPaymentsModule,
    EmailModule,
    FeesModule,
    FinanceModule,
    SupportModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
