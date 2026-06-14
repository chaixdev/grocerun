import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Note: SyncModule is intentionally NOT imported here.
// UsersModule does not broadcast SSE events (profile reads/writes are
// user-scoped and don't need sync push to other clients).
// See auth.guard.ts for how user identity is resolved during sync.
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
