import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemsModule } from './items/items.module';
import { UsersModule } from './users/users.module';
import { HouseholdsModule } from './households/households.module';

@Module({
  imports: [ItemsModule, UsersModule, HouseholdsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
