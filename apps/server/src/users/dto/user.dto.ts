import { createZodDto } from 'nestjs-zod';
import { UpdateProfileSchema } from '@grocerun/dto';

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
