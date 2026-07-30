import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupervisorAssignmentsService } from './supervisor-assignments.service';
import { SupervisorAssignmentsController } from './supervisor-assignments.controller';
import { SupervisorAssignment, SupervisorAssignmentSchema, User, UserSchema, Course, CourseSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupervisorAssignment.name, schema: SupervisorAssignmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [SupervisorAssignmentsController],
  providers: [SupervisorAssignmentsService],
  exports: [SupervisorAssignmentsService, MongooseModule],
})
export class SupervisorAssignmentsModule {}
