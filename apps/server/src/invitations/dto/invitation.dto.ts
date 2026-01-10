import { createZodDto } from 'nestjs-zod';
import { CreateInvitationSchema, JoinHouseholdSchema, RevokeInvitationSchema } from '@grocerun/dto';

export class CreateInvitationDto extends createZodDto(CreateInvitationSchema) {}
export class JoinHouseholdDto extends createZodDto(JoinHouseholdSchema) {}
export class RevokeInvitationDto extends createZodDto(RevokeInvitationSchema) {}
