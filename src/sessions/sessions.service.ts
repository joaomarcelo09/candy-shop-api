import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { CandiesService } from '../candies/candies.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionCandiesService } from '../session-candies/session-candies.service';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { RegisterSaleDto } from './dto/register-sale.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candiesService: CandiesService,
    private readonly sessionCandiesService: SessionCandiesService,
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
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const items = await this.sessionCandiesService.listBySession(id);

    return {
      id: session.id,
      status: session.status,
      total_sold: session.totalSold,
      date: session.date,
      items: items.map((item) => ({
        candy: item.candy.name,
        price: item.candy.price,
        quantity_sold: item.quantitySold,
        subtotal: item.quantitySold * item.candy.price,
      })),
    };
  }

  async registerSale(sessionId: string, registerSaleDto: RegisterSaleDto) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    this.ensureSessionIsOpen(session.status);

    await this.candiesService.findByIdOrFail(registerSaleDto.candy_id);

    return this.sessionCandiesService.registerSale(
      sessionId,
      registerSaleDto.candy_id,
      registerSaleDto.quantity,
    );
  }

  async closeSession(id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    this.ensureSessionIsOpen(session.status);

    const items = await this.sessionCandiesService.listBySession(id);
    const totalSold = items.reduce(
      (sum, item) => sum + item.quantitySold * item.candy.price,
      0,
    );

    return this.prisma.session.update({
      where: { id },
      data: {
        status: SessionStatus.CLOSED,
        totalSold,
      },
    });
  }

  private ensureSessionIsOpen(status: SessionStatus) {
    if (status === SessionStatus.CLOSED) {
      throw new ForbiddenException('Session is already closed');
    }
  }
}
