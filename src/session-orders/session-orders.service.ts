import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CandiesService } from '../candies/candies.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionOrderDto } from '../sessions/dto/create-session-order.dto';

type OrderWithItems = {
  id: string;
  sessionId: string;
  createdAt: Date;
  items: Array<{
    id: string;
    candyId: string;
    quantity: number;
    unitPriceSnapshot: number;
    candy: {
      id: string;
      name: string;
      price: number;
      createdAt: Date;
    };
  }>;
};

@Injectable()
export class SessionOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candiesService: CandiesService,
  ) {}

  async createOrder(sessionId: string, createSessionOrderDto: CreateSessionOrderDto) {
    this.ensureNoDuplicateCandyIds(createSessionOrderDto);

    const candies = await Promise.all(
      createSessionOrderDto.items.map((item) =>
        this.candiesService.findByIdOrFail(item.candy_id),
      ),
    );

    const candyById = new Map(candies.map((candy) => [candy.id, candy]));

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.sessionOrder.create({
        data: {
          sessionId,
        },
      });

      for (const item of createSessionOrderDto.items) {
        const candy = candyById.get(item.candy_id);

        await tx.orderCandy.create({
          data: {
            sessionOrderId: createdOrder.id,
            candyId: item.candy_id,
            quantity: item.quantity,
            unitPriceSnapshot: candy!.price,
          },
        });
      }

      return tx.sessionOrder.findUnique({
        where: { id: createdOrder.id },
        include: {
          items: {
            include: { candy: true },
            orderBy: { candy: { name: 'asc' } },
          },
        },
      });
    });

    return this.mapOrder(order!);
  }

  async listBySession(sessionId: string) {
    const orders = await this.prisma.sessionOrder.findMany({
      where: { sessionId },
      include: {
        items: {
          include: { candy: true },
          orderBy: { candy: { name: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.mapOrder(order));
  }

  async deleteOrder(sessionId: string, orderId: string) {
    const order = await this.prisma.sessionOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.sessionId !== sessionId) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orderCandy.deleteMany({
        where: { sessionOrderId: orderId },
      });

      await tx.sessionOrder.delete({
        where: { id: orderId },
      });
    });
  }

  async buildSessionSummary(sessionId: string) {
    const items = await this.prisma.orderCandy.findMany({
      where: {
        sessionOrder: { sessionId },
      },
      include: {
        candy: true,
      },
      orderBy: [{ candy: { name: 'asc' } }, { unitPriceSnapshot: 'asc' }],
    });

    const aggregatedItems = new Map<
      string,
      { candy: string; price: number; quantity_sold: number; subtotal: number }
    >();

    for (const item of items) {
      const key = `${item.candyId}:${item.unitPriceSnapshot}`;
      const existingItem = aggregatedItems.get(key);
      const subtotal = item.quantity * item.unitPriceSnapshot;

      if (existingItem) {
        existingItem.quantity_sold += item.quantity;
        existingItem.subtotal += subtotal;
        continue;
      }

      aggregatedItems.set(key, {
        candy: item.candy.name,
        price: item.unitPriceSnapshot,
        quantity_sold: item.quantity,
        subtotal,
      });
    }

    return {
      items: [...aggregatedItems.values()],
      totalSold: items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceSnapshot,
        0,
      ),
    };
  }

  private ensureNoDuplicateCandyIds(createSessionOrderDto: CreateSessionOrderDto) {
    const candyIds = createSessionOrderDto.items.map((item) => item.candy_id);
    const uniqueCandyIds = new Set(candyIds);

    if (uniqueCandyIds.size !== candyIds.length) {
      throw new BadRequestException('Duplicated candy entries are not allowed in the same order');
    }
  }

  private mapOrder(order: OrderWithItems) {
    const items = order.items.map((item) => ({
      candy_id: item.candyId,
      candy: item.candy.name,
      quantity: item.quantity,
      unit_price: item.unitPriceSnapshot,
      subtotal: item.quantity * item.unitPriceSnapshot,
    }));

    return {
      id: order.id,
      session_id: order.sessionId,
      created_at: order.createdAt,
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
      items,
    };
  }
}
