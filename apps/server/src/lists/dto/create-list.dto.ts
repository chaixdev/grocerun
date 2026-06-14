import { createZodDto } from 'nestjs-zod';
import { CreateListSchema } from '@grocerun/dto';

export class CreateListDto extends createZodDto(CreateListSchema) {}
