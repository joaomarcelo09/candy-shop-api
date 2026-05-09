import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class RegisterSaleDto {
  @ApiProperty({ example: '9b12786f-2f90-463f-b22a-3745fdc5f4ec' })
  @IsUUID()
  candy_id: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  quantity: number;
}
