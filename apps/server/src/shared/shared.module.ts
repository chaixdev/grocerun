import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { AccessService } from './access.service';
import { NotificationService } from './notification.service';

@Global()
@Module({
  providers: [AccessService, NotificationService, PrismaService, SseBroadcastService],
  exports: [AccessService, NotificationService, PrismaService, SseBroadcastService],
})
export class SharedModule {}
