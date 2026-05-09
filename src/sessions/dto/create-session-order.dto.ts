import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateSessionOrderItemDto } from './create-session-order-item.dto';

export class CreateSessionOrderDto {
  @ApiProperty({
    type: [CreateSessionOrderItemDto],
    example: {
      items: [
        { candy_id: '9b12786f-2f90-463f-b22a-3745fdc5f4ec', quantity: 5 },
        { candy_id: '8c14944f-5c7b-40d9-8b9e-287d7f5f5c71', quantity: 3 },
      ],
    },
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSessionOrderItemDto)
  items: CreateSessionOrderItemDto[];
}
