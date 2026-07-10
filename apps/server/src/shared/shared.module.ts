import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { AccessService } from './access.service';
import { SseSyncBroadcastService } from './sse-sync-broadcast.service';

@Global()
@Module({
  providers: [AccessService, SseSyncBroadcastService, PrismaService, SseBroadcastService],
  exports: [AccessService, SseSyncBroadcastService, PrismaService, SseBroadcastService],
})
export class SharedModule {}
