import { Module } from '@nestjs/common';
import { HouseholdOverviewController } from './household-overview.controller';
import { HouseholdOverviewService } from './household-overview.service';

@Module({
  controllers: [HouseholdOverviewController],
  providers: [HouseholdOverviewService],
})
export class HouseholdOverviewModule {}
