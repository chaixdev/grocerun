import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './auth.guard';

/**
 * Extract authenticated user from request
 * 
 * Usage:
 * @Get('/me')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return { userId: user.sub, email: user.email }
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
