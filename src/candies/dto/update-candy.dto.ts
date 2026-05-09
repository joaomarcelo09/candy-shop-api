import { PartialType } from '@nestjs/swagger';
import { CreateCandyDto } from './create-candy.dto';

export class UpdateCandyDto extends PartialType(CreateCandyDto) {}
