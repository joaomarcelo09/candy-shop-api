import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandyDto } from './dto/create-candy.dto';
import { UpdateCandyDto } from './dto/update-candy.dto';

@Injectable()
export class CandiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCandyDto: CreateCandyDto) {
    const existingCandy = await this.prisma.candy.findUnique({
      where: { name: createCandyDto.name },
    });

    if (existingCandy) {
      throw new ConflictException('Candy name is already in use');
    }

    return this.prisma.candy.create({ data: createCandyDto });
  }

  async findAll() {
    return this.prisma.candy.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, updateCandyDto: UpdateCandyDto) {
    await this.findByIdOrFail(id);

    if (updateCandyDto.name) {
      const candyWithSameName = await this.prisma.candy.findUnique({
        where: { name: updateCandyDto.name },
      });

      if (candyWithSameName && candyWithSameName.id !== id) {
        throw new ConflictException('Candy name is already in use');
      }
    }

    return this.prisma.candy.update({
      where: { id },
      data: updateCandyDto,
    });
  }

  async remove(id: string) {
    await this.findByIdOrFail(id);

    const legacyUsageCount = await this.prisma.sessionCandy.count({
      where: { candyId: id },
    });
    const orderUsageCount = await this.prisma.orderCandy.count({
      where: { candyId: id },
    });

    if (legacyUsageCount > 0 || orderUsageCount > 0) {
      throw new BadRequestException('Candy cannot be deleted because it has sales history');
    }

    await this.prisma.candy.delete({ where: { id } });
  }

  async findByIdOrFail(id: string) {
    const candy = await this.prisma.candy.findUnique({ where: { id } });

    if (!candy) {
      throw new NotFoundException('Candy not found');
    }

    return candy;
  }
}
