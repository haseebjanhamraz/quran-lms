import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument, TicketComment, TicketCommentDocument, TicketStatus, User, UserDocument, Counter, CounterDocument, Role, NotificationType } from '../schemas';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(TicketComment.name) private readonly commentModel: Model<TicketCommentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
    private readonly notificationsService: NotificationsService,
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
    const title = (dto.title || dto.subject || '').trim();
    if (!title) {
      throw new BadRequestException('Title or subject is required');
    }
    const ticketNumber = await this.getNextTicketNumber();
    const isTeacherSupport = user.role === Role.TEACHER;
    const submitterRole = user.role || 'STUDENT';
    const ticket = await this.ticketModel.create({
      ...dto,
      title,
      subject: dto.subject ? dto.subject.trim() : title,
      ticketNumber,
      raisedBy: user.id || user._id,
      raisedByName: user.name,
      submitterRole,
      isTeacherSupport,
      status: TicketStatus.OPEN,
    });

    try {
      await this.notificationsService.createNotification(
        user.id || user._id,
        `Support Ticket Created (${ticketNumber})`,
        `Your ticket "${title}" has been submitted to support.`,
        NotificationType.SUPPORT_TICKET_CREATED,
        { ticketId: ticket._id.toString(), entityType: 'TICKET' },
      );
    } catch (notifErr: any) {
      this.logger.warn(`Failed to dispatch ticket creation notification: ${notifErr.message}`);
    }

    return ticket;
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
    if (query.isTeacherSupport !== undefined) {
      filter.isTeacherSupport = query.isTeacherSupport === 'true' || query.isTeacherSupport === true;
    }
    if (query.submitterRole && query.submitterRole !== 'ALL') {
      filter.submitterRole = query.submitterRole;
    }

    // Teachers & Students only see their own tickets, unless HR / Admin / Staff
    if (user.role === Role.STUDENT || user.role === Role.TEACHER) {
      filter.raisedBy = user.id || user._id;
    }

    return this.ticketModel
      .find(filter)
      .populate('raisedBy', 'name email role guardianName guardianPhone')
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

    // Send in-app notification to ticket owner or assigned staff
    try {
      const recipientId = ticket.raisedBy?.toString();
      const commenterId = (user.id || user._id)?.toString();
      if (recipientId && recipientId !== commenterId && !isInternal) {
        await this.notificationsService.createNotification(
          recipientId,
          `New Reply on #${ticket.ticketNumber || ticket.id}`,
          `${user.name || 'Support Staff'}: ${comment.slice(0, 100)}`,
          NotificationType.SUPPORT_TICKET_REPLIED,
          { ticketId: ticket._id.toString(), entityType: 'TICKET' },
        );
      }
    } catch (notifErr: any) {
      this.logger.warn(`Failed to dispatch ticket comment notification: ${notifErr.message}`);
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
