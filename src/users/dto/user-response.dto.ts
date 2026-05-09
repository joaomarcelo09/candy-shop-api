import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '9b12786f-2f90-463f-b22a-3745fdc5f4ec' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@email.com' })
  email: string;

  @ApiProperty({ example: '2026-05-08T13:00:00.000Z' })
  createdAt: Date;
}
