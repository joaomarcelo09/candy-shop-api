import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString } from 'class-validator';

export class CreateCandyDto {
  @ApiProperty({ example: 'Chocolate' })
  @IsString()
  name: string;

  @ApiProperty({ example: 500, description: 'Price in cents' })
  @IsInt()
  @IsPositive()
  price: number;
}
