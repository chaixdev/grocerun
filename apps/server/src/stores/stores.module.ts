import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { SyncModule } from '../sync/sync.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [SyncModule],
  controllers: [StoresController],
  providers: [StoresService, PrismaService],
})
export class StoresModule {}
