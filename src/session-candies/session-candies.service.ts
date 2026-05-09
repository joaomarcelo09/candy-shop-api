import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionCandiesService {
  constructor(private readonly prisma: PrismaService) {}

  async registerSale(sessionId: string, candyId: string, quantity: number) {
    const existingRelation = await this.prisma.sessionCandy.findUnique({
      where: {
        sessionId_candyId: {
          sessionId,
          candyId,
        },
      },
    });

    if (existingRelation) {
      return this.prisma.sessionCandy.update({
        where: { id: existingRelation.id },
        data: {
          quantitySold: existingRelation.quantitySold + quantity,
        },
      });
    }

    return this.prisma.sessionCandy.create({
      data: {
        sessionId,
        candyId,
        quantitySold: quantity,
      },
    });
  }

  async listBySession(sessionId: string) {
    return this.prisma.sessionCandy.findMany({
      where: { sessionId },
      include: { candy: true },
      orderBy: { candy: { name: 'asc' } },
    });
  }
}
