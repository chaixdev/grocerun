import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { UsersService } from './users.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  image?: string;
}

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
