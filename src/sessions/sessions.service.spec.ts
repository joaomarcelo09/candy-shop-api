import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { CandiesService } from '../candies/candies.service';
import { FakePrismaService } from '../../test/support/fake-prisma';
import { SessionCandiesService } from '../session-candies/session-candies.service';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let prisma: FakePrismaService;
  let candiesService: CandiesService;
  let sessionCandiesService: SessionCandiesService;
  let sessionsService: SessionsService;

  beforeEach(() => {
    prisma = new FakePrismaService();
    candiesService = new CandiesService(prisma as never);
    sessionCandiesService = new SessionCandiesService(prisma as never);
    sessionsService = new SessionsService(
      prisma as never,
      candiesService,
      sessionCandiesService,
    );
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

  it('increments quantity instead of creating duplicate session-candy rows', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });

    await sessionsService.registerSale(session.id, { candy_id: candy.id, quantity: 1 });
    await sessionsService.registerSale(session.id, { candy_id: candy.id, quantity: 2 });

    expect(prisma.sessionCandiesRecords).toHaveLength(1);
    expect(prisma.sessionCandiesRecords[0].quantitySold).toBe(3);
  });

  it('calculates the session total when closing', async () => {
    const session = await sessionsService.create();
    const chocolate = await candiesService.create({ name: 'Chocolate', price: 500 });
    const gummy = await candiesService.create({ name: 'Gummy', price: 250 });

    await sessionsService.registerSale(session.id, { candy_id: chocolate.id, quantity: 2 });
    await sessionsService.registerSale(session.id, { candy_id: gummy.id, quantity: 3 });

    const closedSession = await sessionsService.closeSession(session.id);

    expect(closedSession.status).toBe(SessionStatus.CLOSED);
    expect(closedSession.totalSold).toBe(1750);
  });

  it('blocks adding sales to a closed session', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });
    await sessionsService.closeSession(session.id);

    await expect(
      sessionsService.registerSale(session.id, { candy_id: candy.id, quantity: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks closing an already closed session', async () => {
    const session = await sessionsService.create();
    await sessionsService.closeSession(session.id);

    await expect(sessionsService.closeSession(session.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns session details with subtotals', async () => {
    const session = await sessionsService.create();
    const candy = await candiesService.create({ name: 'Chocolate', price: 500 });
    await sessionsService.registerSale(session.id, { candy_id: candy.id, quantity: 3 });

    const details = await sessionsService.findOne(session.id);

    expect(details.total_sold).toBe(0);
    expect(details.items).toEqual([
      {
        candy: 'Chocolate',
        price: 500,
        quantity_sold: 3,
        subtotal: 1500,
      },
    ]);
  });
});
