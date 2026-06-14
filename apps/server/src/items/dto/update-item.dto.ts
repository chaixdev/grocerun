import { createZodDto } from 'nestjs-zod';
import { UpdateItemSchema } from '@grocerun/dto';

const UpdateItemBodySchema = UpdateItemSchema.omit({ itemId: true });

export class UpdateItemDto extends createZodDto(UpdateItemBodySchema) {}
