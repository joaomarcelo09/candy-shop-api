import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CandiesService } from './candies.service';
import { FakePrismaService } from '../../test/support/fake-prisma';

describe('CandiesService', () => {
  let service: CandiesService;
  let prisma: FakePrismaService;

  beforeEach(() => {
    prisma = new FakePrismaService();
    service = new CandiesService(prisma as never);
  });

  it('creates a candy', async () => {
    const candy = await service.create({ name: 'Chocolate', price: 500 });

    expect(candy.name).toBe('Chocolate');
    expect(candy.price).toBe(500);
  });

  it('blocks duplicate candy names', async () => {
    await service.create({ name: 'Chocolate', price: 500 });

    await expect(service.create({ name: 'Chocolate', price: 600 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates an existing candy', async () => {
    const candy = await service.create({ name: 'Chocolate', price: 500 });

    const updated = await service.update(candy.id, { price: 550 });

    expect(updated?.price).toBe(550);
  });

  it('prevents deleting candies that exist in session history', async () => {
    const candy = await service.create({ name: 'Chocolate', price: 500 });
    prisma.sessionCandiesRecords.push({
      id: 'relation-1',
      sessionId: 'session-1',
      candyId: candy.id,
      quantitySold: 1,
    });

    await expect(service.remove(candy.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when candy does not exist', async () => {
    await expect(service.findByIdOrFail('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
