import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import {
  Course, CourseSchema,
  User, UserSchema,
  Enrollment, EnrollmentSchema,
  ClassSession, ClassSessionSchema,
  SubjectCategory, SubjectCategorySchema,
  Student, StudentSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: SubjectCategory.name, schema: SubjectCategorySchema },
      { name: Student.name, schema: StudentSchema },
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, MongooseModule],
})
export class CoursesModule {}
