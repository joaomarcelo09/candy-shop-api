import { Module } from '@nestjs/common';
import { CandiesModule } from '../candies/candies.module';
import { SessionOrdersService } from './session-orders.service';

@Module({
  imports: [CandiesModule],
  providers: [SessionOrdersService],
  exports: [SessionOrdersService],
})
export class SessionOrdersModule {}
