import { createZodDto } from 'nestjs-zod';
import { CreateSectionSchema, UpdateSectionSchema, ReorderSectionsSchema } from '@grocerun/dto';

export class CreateSectionDto extends createZodDto(CreateSectionSchema) {}
export class UpdateSectionDto extends createZodDto(UpdateSectionSchema.omit({ id: true })) {}
export class ReorderSectionsDto extends createZodDto(ReorderSectionsSchema.omit({ storeId: true })) {}
