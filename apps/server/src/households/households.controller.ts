import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { HouseholdsService } from './households.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class CreateHouseholdDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class RenameHouseholdDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

@Controller('households')
@UseGuards(AuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get()
  async getHouseholds(@CurrentUser() user: JwtPayload) {
    return this.householdsService.getHouseholds(user.sub);
  }

  @Post()
  async createHousehold(
    @Body() dto: CreateHouseholdDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.createHousehold(dto, user.sub);
  }

  @Patch(':id')
  async renameHousehold(
    @Param('id') householdId: string,
    @Body() dto: RenameHouseholdDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.renameHousehold(householdId, dto, user.sub);
  }

  @Post(':id/leave')
  async leaveHousehold(
    @Param('id') householdId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.leaveHousehold(householdId, user.sub);
  }

  @Delete(':id')
  async deleteHousehold(
    @Param('id') householdId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.householdsService.deleteHousehold(householdId, user.sub);
  }
}
