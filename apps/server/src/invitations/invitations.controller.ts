import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { InvitationsService } from './invitations.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class CreateInvitationDto {
  @IsString()
  @IsNotEmpty()
  householdId: string;
}

export class JoinHouseholdDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RevokeInvitationDto {
  @IsString()
  @IsNotEmpty()
  invitationId: string;
}

@Controller('invitations')
@UseGuards(AuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitationsService.createInvitation(dto, user.sub);
  }

  @Post('join')
  async joinHousehold(
    @Body() dto: JoinHouseholdDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitationsService.joinHousehold(dto, user.sub);
  }

  @Patch('revoke')
  async revokeInvitation(
    @Body() dto: RevokeInvitationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitationsService.revokeInvitation(dto, user.sub);
  }

  @Get(':token/details')
  async getInvitationDetails(
    @Param('token') token: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitationsService.getInvitationDetails(token, user.sub);
  }
}
