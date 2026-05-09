import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionOrdersService } from '../session-orders/session-orders.service';
import { CreateSessionOrderDto } from './dto/create-session-order.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionOrdersService: SessionOrdersService,
  ) {}

  async create() {
    const existingOpenSession = await this.prisma.session.findFirst({
      where: { status: SessionStatus.OPEN },
    });

    if (existingOpenSession) {
      throw new BadRequestException('There is already an active session');
    }

    return this.prisma.session.create({
      data: {
        status: SessionStatus.OPEN,
        totalSold: 0,
        date: new Date(),
      },
      select: {
        id: true,
        status: true,
        totalSold: true,
        date: true,
        createdAt: true,
      },
    });
  }

  async findAll(query: ListSessionsQueryDto) {
    return this.prisma.session.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { date: 'desc' },
    });
  }

  async findCurrentOpen() {
    return this.prisma.session.findFirst({
      where: { status: SessionStatus.OPEN },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const session = await this.findSessionOrFail(id);
    const summary = await this.sessionOrdersService.buildSessionSummary(id);

    return {
      id: session.id,
      status: session.status,
      total_sold: session.totalSold,
      date: session.date,
      items: summary.items,
    };
  }

  async createOrder(sessionId: string, createSessionOrderDto: CreateSessionOrderDto) {
    const session = await this.findSessionOrFail(sessionId);
    this.ensureSessionIsOpen(session.status);

    return this.sessionOrdersService.createOrder(sessionId, createSessionOrderDto);
  }

  async listOrders(sessionId: string) {
    await this.findSessionOrFail(sessionId);
    return this.sessionOrdersService.listBySession(sessionId);
  }

  async deleteOrder(sessionId: string, orderId: string) {
    const session = await this.findSessionOrFail(sessionId);
    this.ensureSessionIsOpen(session.status);

    await this.sessionOrdersService.deleteOrder(sessionId, orderId);
  }

  async closeSession(id: string) {
    const session = await this.findSessionOrFail(id);
    this.ensureSessionIsOpen(session.status);
    const summary = await this.sessionOrdersService.buildSessionSummary(id);

    return this.prisma.session.update({
      where: { id },
      data: {
        status: SessionStatus.CLOSED,
        totalSold: summary.totalSold,
      },
    });
  }

  private async findSessionOrFail(id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  private ensureSessionIsOpen(status: SessionStatus) {
    if (status === SessionStatus.CLOSED) {
      throw new ForbiddenException('Session is already closed');
    }
  }
}
