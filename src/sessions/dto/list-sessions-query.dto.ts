import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListSessionsQueryDto {
  @ApiPropertyOptional({ enum: SessionStatus, example: SessionStatus.OPEN })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
