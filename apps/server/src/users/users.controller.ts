import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, data);
  }
}
