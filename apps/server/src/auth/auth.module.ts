import { Module, Global } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Global()
@Module({
    providers: [AuthGuard, AuthService],
    exports: [AuthGuard, AuthService],
})
export class AuthModule {}
