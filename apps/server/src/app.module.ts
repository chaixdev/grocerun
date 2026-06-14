import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsModule } from './items/items.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HouseholdsModule } from './households/households.module';
import { StoresModule } from './stores/stores.module';
import { SectionsModule } from './sections/sections.module';
import { HouseholdOverviewModule } from './household-overview/household-overview.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ListsModule } from './lists/lists.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ItemsModule,
    HealthModule,
    UsersModule,
    HouseholdsModule,
    StoresModule,
    SectionsModule,
    HouseholdOverviewModule,
    InvitationsModule,
    ListsModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
