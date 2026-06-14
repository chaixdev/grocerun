import { Module } from '@nestjs/common';
import { HouseholdOverviewController } from './household-overview.controller';
import { HouseholdOverviewService } from './household-overview.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [HouseholdOverviewController],
  providers: [HouseholdOverviewService, PrismaService],
})
export class HouseholdOverviewModule {}
