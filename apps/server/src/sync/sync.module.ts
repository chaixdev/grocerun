import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SseBroadcastService } from './sse-broadcast.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService, SseBroadcastService, PrismaService],
  exports: [SseBroadcastService],
})
export class SyncModule {}
