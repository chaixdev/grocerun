import { Module } from '@nestjs/common';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [HouseholdsController],
  providers: [HouseholdsService, PrismaService],
})
export class HouseholdsModule {}
