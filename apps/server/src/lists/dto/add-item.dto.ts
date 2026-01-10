import { createZodDto } from 'nestjs-zod';
import { AddItemSchema } from '@grocerun/dto';

export class AddItemDto extends createZodDto(AddItemSchema) {}
