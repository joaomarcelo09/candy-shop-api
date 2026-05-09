import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandiesService } from './candies.service';
import { CreateCandyDto } from './dto/create-candy.dto';
import { UpdateCandyDto } from './dto/update-candy.dto';

@ApiTags('candies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('candies')
export class CandiesController {
  constructor(private readonly candiesService: CandiesService) {}

  @Post()
  @ApiCreatedResponse({
    schema: {
      example: {
        id: '9b12786f-2f90-463f-b22a-3745fdc5f4ec',
        name: 'Chocolate',
        price: 500,
        createdAt: '2026-05-08T13:00:00.000Z',
      },
    },
  })
  create(@Body() createCandyDto: CreateCandyDto) {
    return this.candiesService.create(createCandyDto);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: '9b12786f-2f90-463f-b22a-3745fdc5f4ec',
          name: 'Chocolate',
          price: 500,
          createdAt: '2026-05-08T13:00:00.000Z',
        },
      ],
    },
  })
  findAll() {
    return this.candiesService.findAll();
  }

  @Patch(':id')
  @ApiOkResponse({
    schema: {
      example: {
        id: '9b12786f-2f90-463f-b22a-3745fdc5f4ec',
        name: 'Chocolate',
        price: 550,
        createdAt: '2026-05-08T13:00:00.000Z',
      },
    },
  })
  update(@Param('id') id: string, @Body() updateCandyDto: UpdateCandyDto) {
    return this.candiesService.update(id, updateCandyDto);
  }

  @Delete(':id')
  @ApiNoContentResponse()
  async remove(@Param('id') id: string) {
    await this.candiesService.remove(id);
  }
}
