import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { SyncModule } from '../sync/sync.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [SyncModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, PrismaService],
})
export class InvitationsModule {}
