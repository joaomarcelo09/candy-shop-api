import { Module } from '@nestjs/common';
import { SessionOrdersModule } from '../session-orders/session-orders.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [SessionOrdersModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
