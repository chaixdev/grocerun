import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SseBroadcastService } from './sse-broadcast.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService, SseBroadcastService],
  exports: [SseBroadcastService],
})
export class SyncModule {}
