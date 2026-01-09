import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsModule } from './items/items.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ItemsModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
