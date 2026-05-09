import { Module } from '@nestjs/common';
import { SessionCandiesService } from './session-candies.service';

@Module({
  providers: [SessionCandiesService],
  exports: [SessionCandiesService],
})
export class SessionCandiesModule {}
