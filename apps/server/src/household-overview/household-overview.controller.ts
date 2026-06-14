import { Controller, Get, UseGuards } from '@nestjs/common';
import { HouseholdOverviewService } from './household-overview.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('household-overview')
@UseGuards(AuthGuard)
export class HouseholdOverviewController {
  constructor(private readonly householdOverviewService: HouseholdOverviewService) {}

  @Get()
  async getHouseholdOverview(@CurrentUser() user: JwtPayload) {
    return this.householdOverviewService.getHouseholdOverview(user.sub);
  }
}
