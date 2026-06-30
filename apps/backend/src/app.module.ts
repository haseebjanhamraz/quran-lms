import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { validate } from './config/env.validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ClassSessionsModule } from './class-sessions/class-sessions.module';
import { ReviewerAssignmentsModule } from './reviewer-assignments/reviewer-assignments.module';
import { LivekitModule } from './livekit/livekit.module';
import { BullModule } from '@nestjs/bullmq';
import { RecordingsModule } from './recordings/recordings.module';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { ClassReviewsModule } from './class-reviews/class-reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    ClassSessionsModule,
    ReviewerAssignmentsModule,
    LivekitModule,
    RecordingsModule,
    GoogleDriveModule,
    ClassReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
