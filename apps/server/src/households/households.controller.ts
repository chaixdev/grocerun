import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateHouseholdDto, UpdateHouseholdDto } from './dto/household.dto';

@Controller('households')
@UseGuards(AuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get()
  async getHouseholds(@CurrentUser() user: JwtPayload) {
    return this.householdsService.getHouseholds(user.userId!);
  }

  @Post()
  async createHousehold(
    @Body() dto: CreateHouseholdDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.createHousehold(dto, user.userId!);
  }

  @Patch(':id')
  async renameHousehold(
    @Param('id') householdId: string,
    @Body() dto: UpdateHouseholdDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.renameHousehold(householdId, dto, user.userId!);
  }

  @Post(':id/leave')
  async leaveHousehold(
    @Param('id') householdId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.leaveHousehold(householdId, user.userId!);
  }

  @Delete(':id')
  async deleteHousehold(
    @Param('id') householdId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.deleteHousehold(householdId, user.userId!);
  }

  @Delete(':id/members/:memberUserId')
  async removeMember(
    @Param('id') householdId: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.removeMember(householdId, memberUserId, user.userId!);
  }
}
