import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { RegisterSaleDto } from './dto/register-sale.dto';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOkResponse({
    schema: {
      example: {
        id: '9b12786f-2f90-463f-b22a-3745fdc5f4ec',
        status: 'OPEN',
        totalSold: 0,
      },
    },
  })
  create(@Body() _createSessionDto: CreateSessionDto) {
    return this.sessionsService.create();
  }

  @Get()
  findAll(@Query() query: ListSessionsQueryDto) {
    return this.sessionsService.findAll(query);
  }

  @Get('open/current')
  findCurrentOpen() {
    return this.sessionsService.findCurrentOpen();
  }

  @Get(':id')
  @ApiOkResponse({
    schema: {
      example: {
        id: '9b12786f-2f90-463f-b22a-3745fdc5f4ec',
        status: 'OPEN',
        total_sold: 1500,
        items: [
          {
            candy: 'Chocolate',
            price: 500,
            quantity_sold: 3,
            subtotal: 1500,
          },
        ],
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post(':id/sales')
  registerSale(@Param('id') id: string, @Body() registerSaleDto: RegisterSaleDto) {
    return this.sessionsService.registerSale(id, registerSaleDto);
  }

  @Patch(':id/close')
  closeSession(@Param('id') id: string) {
    return this.sessionsService.closeSession(id);
  }
}
