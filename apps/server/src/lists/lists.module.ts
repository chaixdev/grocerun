import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { SyncModule } from '../sync/sync.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [SyncModule],
  controllers: [ListsController],
  providers: [ListsService, PrismaService],
})
export class ListsModule {}
