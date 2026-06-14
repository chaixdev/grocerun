import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';
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
import { SharedModule } from './shared/shared.module';

const spaDistPath = process.env.SPA_DIST_DIR ?? [
  // Source layout: apps/server/src -> apps/web/dist
  join(__dirname, '..', '..', 'web', 'dist'),
  // Compiled layout: apps/server/dist/src -> apps/web/dist
  join(__dirname, '..', '..', '..', 'web', 'dist'),
].find((candidate) => existsSync(candidate)) ?? join(__dirname, '..', '..', '..', 'web', 'dist');

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    // Serve the Vite-built SPA in production
    ServeStaticModule.forRoot({
      rootPath: spaDistPath,
      exclude: ['/api/v1/(.*)', '/health'],
    }),
    SharedModule,
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
})
export class AppModule {}
