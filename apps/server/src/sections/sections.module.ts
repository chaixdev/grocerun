import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { SyncModule } from '../sync/sync.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [SyncModule],
  controllers: [SectionsController],
  providers: [SectionsService, PrismaService],
})
export class SectionsModule {}
