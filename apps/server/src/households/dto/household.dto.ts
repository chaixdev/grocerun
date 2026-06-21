import { createZodDto } from 'nestjs-zod';
import { CreateHouseholdSchema, UpdateHouseholdSchema, RemoveMemberParamsSchema } from '@grocerun/dto';

export class CreateHouseholdDto extends createZodDto(CreateHouseholdSchema) {}
export class UpdateHouseholdDto extends createZodDto(UpdateHouseholdSchema) {}
export class RemoveMemberParamsDto extends createZodDto(RemoveMemberParamsSchema) {}
