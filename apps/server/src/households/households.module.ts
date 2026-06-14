import { Module } from '@nestjs/common';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { SyncModule } from '../sync/sync.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [SyncModule],
  controllers: [HouseholdsController],
  providers: [HouseholdsService, PrismaService],
})
export class HouseholdsModule {}
