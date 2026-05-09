import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { CandiesService } from '../candies/candies.service';
import { SessionOrdersService } from '../session-orders/session-orders.service';
import { FakePrismaService } from '../../test/support/fake-prisma';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let prisma: FakePrismaService;
  let candiesService: CandiesService;
  let sessionOrdersService: SessionOrdersService;
  let sessionsService: SessionsService;

  beforeEach(() => {
    prisma = new FakePrismaService();
    candiesService = new CandiesService(prisma as never);
    sessionOrdersService = new SessionOrdersService(prisma as never, candiesService);
    sessionsService = new SessionsService(prisma as never, sessionOrdersService);
  });

  it('creates an open session with zero total sold', async () => {
    const session = await sessionsService.create();

    expect(session.status).toBe(SessionStatus.OPEN);
    expect(session.totalSold).toBe(0);
  });

  it('prevents multiple open sessions', async () => {
    await sessionsService.create();

    await expect(sessionsService.create()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a multi-item order in an open session', async () => {
    const session = await sessionsService.create();
    const chocolate = await candiesService.create({ name: 'Chocolate', price: 500 });
    const gummy = await candiesService.create({ name: 'Gummy', price: 300 });

    const order = await sessionsService.createOrder(session.id, {
      items: [
        { candy_id: chocolate.id, quantity: 2 },
        { candy_id: gummy.id, quantity: 3 },
      ],
    });

    expect(order.total).toBe(1900);
    expect(order.items).toEqual([
      {
        candy_id: chocolate.id,
        candy: 'Chocolate',
        quantity: 2,
        unit_price: 500,
        subtotal: 1000,
      },
      {
        candy_id: gummy.id,
        candy: 'Gummy',
        quantity: 3,
        unit_price: 300,
        subtotal: 900,
      },
    ]);
    expect(prisma.sessionOrdersRecords).toHaveLength(1);
    expect(prisma.orderCandiesRecords).toHaveLength(2);
  });

  it('rejects order creation for a closed session', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });
    await sessionsService.closeSession(session.id);

    await expect(
      sessionsService.createOrder(session.id, {
        items: [{ candy_id: candy.id, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicated candies in the same order payload', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });

    await expect(
      sessionsService.createOrder(session.id, {
        items: [
          { candy_id: candy.id, quantity: 1 },
          { candy_id: candy.id, quantity: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid candy ids', async () => {
    const session = await sessionsService.create();

    await expect(
      sessionsService.createOrder(session.id, {
        items: [{ candy_id: 'missing-candy', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an order from an open session', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });
    const order = await sessionsService.createOrder(session.id, {
      items: [{ candy_id: candy.id, quantity: 2 }],
    });

    await sessionsService.deleteOrder(session.id, order.id);

    expect(prisma.sessionOrdersRecords).toHaveLength(0);
    expect(prisma.orderCandiesRecords).toHaveLength(0);
  });

  it('rejects deleting orders from a closed session', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });
    const order = await sessionsService.createOrder(session.id, {
      items: [{ candy_id: candy.id, quantity: 2 }],
    });
    await sessionsService.closeSession(session.id);

    await expect(sessionsService.deleteOrder(session.id, order.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('lists session orders in reverse chronological order', async () => {
    const session = await sessionsService.create();
    const chocolate = await candiesService.create({ name: 'Chocolate', price: 500 });
    const gummy = await candiesService.create({ name: 'Gummy', price: 250 });
    const firstOrder = await sessionsService.createOrder(session.id, {
      items: [{ candy_id: chocolate.id, quantity: 1 }],
    });
    prisma.sessionOrdersRecords[0].createdAt = new Date('2026-05-09T15:00:00.000Z');
    const secondOrder = await sessionsService.createOrder(session.id, {
      items: [{ candy_id: gummy.id, quantity: 2 }],
    });
    prisma.sessionOrdersRecords[1].createdAt = new Date('2026-05-09T15:01:00.000Z');

    const orders = await sessionsService.listOrders(session.id);

    expect(orders.map((order) => order.id)).toEqual([secondOrder.id, firstOrder.id]);
  });

  it('aggregates session details from multiple orders', async () => {
    const session = await sessionsService.create();
    const chocolate = await candiesService.create({ name: 'Chocolate', price: 500 });
    const gummy = await candiesService.create({ name: 'Gummy', price: 250 });

    await sessionsService.createOrder(session.id, {
      items: [
        { candy_id: chocolate.id, quantity: 1 },
        { candy_id: gummy.id, quantity: 2 },
      ],
    });
    await sessionsService.createOrder(session.id, {
      items: [{ candy_id: chocolate.id, quantity: 3 }],
    });

    const details = await sessionsService.findOne(session.id);

    expect(details.total_sold).toBe(0);
    expect(details.items).toEqual([
      {
        candy: 'Chocolate',
        price: 500,
        quantity_sold: 4,
        subtotal: 2000,
      },
      {
        candy: 'Gummy',
        price: 250,
        quantity_sold: 2,
        subtotal: 500,
      },
    ]);
  });

  it('calculates the session total from orders when closing', async () => {
    const session = await sessionsService.create();
    const chocolate = await candiesService.create({ name: 'Chocolate', price: 500 });
    const gummy = await candiesService.create({ name: 'Gummy', price: 250 });

    await sessionsService.createOrder(session.id, {
      items: [{ candy_id: chocolate.id, quantity: 2 }],
    });
    await sessionsService.createOrder(session.id, {
      items: [{ candy_id: gummy.id, quantity: 3 }],
    });

    const closedSession = await sessionsService.closeSession(session.id);

    expect(closedSession.status).toBe(SessionStatus.CLOSED);
    expect(closedSession.totalSold).toBe(1750);
  });

  it('preserves historical totals when candy price changes later', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });

    await sessionsService.createOrder(session.id, {
      items: [{ candy_id: candy.id, quantity: 2 }],
    });

    await candiesService.update(candy.id, { price: 900 });

    await sessionsService.createOrder(session.id, {
      items: [{ candy_id: candy.id, quantity: 1 }],
    });

    const details = await sessionsService.findOne(session.id);
    const closedSession = await sessionsService.closeSession(session.id);

    expect(details.items).toEqual([
      {
        candy: 'Chocolate',
        price: 500,
        quantity_sold: 2,
        subtotal: 1000,
      },
      {
        candy: 'Chocolate',
        price: 900,
        quantity_sold: 1,
        subtotal: 900,
      },
    ]);
    expect(closedSession.totalSold).toBe(1900);
  });

  it('blocks closing an already closed session', async () => {
    const session = await sessionsService.create();
    await sessionsService.closeSession(session.id);

    await expect(sessionsService.closeSession(session.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
