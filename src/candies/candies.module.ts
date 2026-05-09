import { Module } from '@nestjs/common';
import { CandiesController } from './candies.controller';
import { CandiesService } from './candies.service';

@Module({
  controllers: [CandiesController],
  providers: [CandiesService],
  exports: [CandiesService],
})
export class CandiesModule {}
