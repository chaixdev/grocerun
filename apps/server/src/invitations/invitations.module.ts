import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, PrismaService],
})
export class InvitationsModule {}
