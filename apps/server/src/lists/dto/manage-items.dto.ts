import { createZodDto } from 'nestjs-zod';
import { ToggleItemSchema, UpdateQuantitySchema, RemoveItemSchema, ListIdSchema } from '@grocerun/dto';

export class ToggleItemDto extends createZodDto(ToggleItemSchema) {}
export class UpdateQuantityDto extends createZodDto(UpdateQuantitySchema) {}
export class RemoveItemDto extends createZodDto(RemoveItemSchema) {}
export class ListIdDto extends createZodDto(ListIdSchema) {}
