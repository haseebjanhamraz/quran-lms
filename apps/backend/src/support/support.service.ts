import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument, TicketComment, TicketCommentDocument, TicketStatus, User, UserDocument, Counter, CounterDocument, Role } from '../schemas';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(TicketComment.name) private readonly commentModel: Model<TicketCommentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
  ) {}

  private async getNextTicketNumber(): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'ticketNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const num = String(counter.seq).padStart(5, '0');
    return `TKT-${num}`;
  }

  async createTicket(dto: CreateTicketDto, user: any) {
    const ticketNumber = await this.getNextTicketNumber();
    return this.ticketModel.create({
      ...dto,
      ticketNumber,
      raisedBy: user.id || user._id,
      raisedByName: user.name,
      status: TicketStatus.OPEN,
    });
  }

  async findAll(query: any = {}, user: any) {
    const filter: any = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.priority && query.priority !== 'ALL') {
      filter.priority = query.priority;
    }
    if (query.category && query.category !== 'ALL') {
      filter.category = query.category;
    }

    // Parents / Students only see their own tickets, unless HR / Admin / Staff
    if (user.role === Role.STUDENT) {
      filter.raisedBy = user.id || user._id;
    }

    return this.ticketModel
      .find(filter)
      .populate('raisedBy', 'name email guardianName guardianPhone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const ticket = await this.ticketModel.findById(id)
      .populate('raisedBy', 'name email guardianName guardianPhone')
      .populate('assignedTo', 'name email');
    if (!ticket) throw new NotFoundException('Ticket not found');

    const comments = await this.commentModel.find({ ticketId: id }).sort({ createdAt: 1 });
    return { ticket, comments };
  }

  async updateTicket(id: string, updateData: any) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (updateData.assignedToId) {
      const assignee = await this.userModel.findById(updateData.assignedToId);
      if (assignee) {
        ticket.assignedTo = assignee._id.toString();
        ticket.assignedToName = assignee.name;
      }
    }

    if (updateData.status) {
      ticket.status = updateData.status;
      if (updateData.status === TicketStatus.RESOLVED) {
        ticket.resolvedAt = new Date();
      } else if (updateData.status === TicketStatus.CLOSED) {
        ticket.closedAt = new Date();
      }
    }

    if (updateData.priority) {
      ticket.priority = updateData.priority;
    }

    return ticket.save();
  }

  async addComment(ticketId: string, comment: string, user: any, isInternal = false) {
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const commentDoc = await this.commentModel.create({
      ticketId,
      comment,
      commentBy: user.id || user._id,
      commentByName: user.name,
      isInternal,
    });

    if (ticket.status === TicketStatus.OPEN && user.role !== Role.STUDENT) {
      ticket.status = TicketStatus.IN_PROGRESS;
      await ticket.save();
    }

    return commentDoc;
  }

  async getDashboardStats() {
    const total = await this.ticketModel.countDocuments();
    const openCount = await this.ticketModel.countDocuments({ status: TicketStatus.OPEN });
    const inProgressCount = await this.ticketModel.countDocuments({ status: TicketStatus.IN_PROGRESS });
    const urgentCount = await this.ticketModel.countDocuments({ priority: 'URGENT', status: { $ne: TicketStatus.CLOSED } });

    const recentTickets = await this.ticketModel
      .find()
      .populate('raisedBy', 'name email guardianName')
      .limit(5)
      .sort({ createdAt: -1 });

    return {
      total,
      openCount,
      inProgressCount,
      urgentCount,
      recentTickets,
    };
  }
}
