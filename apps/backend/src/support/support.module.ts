import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { Ticket, TicketSchema, TicketComment, TicketCommentSchema, User, UserSchema, Counter, CounterSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: TicketComment.name, schema: TicketCommentSchema },
      { name: User.name, schema: UserSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService, MongooseModule],
})
export class SupportModule {}
