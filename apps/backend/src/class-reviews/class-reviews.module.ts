import { Module } from '@nestjs/common';
import { ClassReviewsService } from './class-reviews.service';
import { ClassReviewsController } from './class-reviews.controller';

@Module({
  controllers: [ClassReviewsController],
  providers: [ClassReviewsService],
  exports: [ClassReviewsService],
})
export class ClassReviewsModule {}
