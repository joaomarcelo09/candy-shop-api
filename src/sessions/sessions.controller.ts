import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSessionOrderDto } from './dto/create-session-order.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
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

  @Post(':id/orders')
  @ApiOkResponse({
    schema: {
      example: {
        id: 'b4dc64a2-45c6-4747-95ba-7222df58d6da',
        session_id: '9b12786f-2f90-463f-b22a-3745fdc5f4ec',
        created_at: '2026-05-09T15:00:00.000Z',
        total: 3400,
        items: [
          {
            candy_id: '8c14944f-5c7b-40d9-8b9e-287d7f5f5c71',
            candy: 'Chocolate',
            quantity: 5,
            unit_price: 500,
            subtotal: 2500,
          },
        ],
      },
    },
  })
  createOrder(@Param('id') id: string, @Body() createSessionOrderDto: CreateSessionOrderDto) {
    return this.sessionsService.createOrder(id, createSessionOrderDto);
  }

  @Get(':id/orders')
  listOrders(@Param('id') id: string) {
    return this.sessionsService.listOrders(id);
  }

  @Delete(':sessionId/orders/:orderId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async deleteOrder(
    @Param('sessionId') sessionId: string,
    @Param('orderId') orderId: string,
  ) {
    await this.sessionsService.deleteOrder(sessionId, orderId);
  }

  @Patch(':id/close')
  closeSession(@Param('id') id: string) {
    return this.sessionsService.closeSession(id);
  }
}
