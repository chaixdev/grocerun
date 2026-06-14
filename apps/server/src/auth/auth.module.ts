import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.AUTH_SECRET,
      signOptions: { expiresIn: '30d' }, // Match NextAuth default
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
