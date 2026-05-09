import { Module } from '@nestjs/common';
import { CandiesModule } from '../candies/candies.module';
import { SessionCandiesModule } from '../session-candies/session-candies.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [CandiesModule, SessionCandiesModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
