import { createZodDto } from 'nestjs-zod';
import { CreateHouseholdSchema, UpdateHouseholdSchema } from '@grocerun/dto';

export class CreateHouseholdDto extends createZodDto(CreateHouseholdSchema) {}
export class UpdateHouseholdDto extends createZodDto(UpdateHouseholdSchema) {}
