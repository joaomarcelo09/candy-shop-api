import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional({
    description: 'Reserved for future session metadata. Current API ignores the payload.',
    example: null,
    nullable: true,
  })
  note?: string | null;
}
