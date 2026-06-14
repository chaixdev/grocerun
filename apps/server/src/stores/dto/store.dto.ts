import { createZodDto } from 'nestjs-zod';
import { CreateStoreSchema, UpdateStoreSchema } from '@grocerun/dto';

export class CreateStoreDto extends createZodDto(CreateStoreSchema) {}
export class UpdateStoreDto extends createZodDto(UpdateStoreSchema) {}
