import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async pull(@Query('minUpdatedAt') minUpdatedAt?: string) {
    const date = minUpdatedAt ? new Date(minUpdatedAt) : new Date(0);
    const documents = await this.usersService.pull(date);
    return {
      documents,
      checkpoint: {
        updatedAt: documents.length > 0 ? documents[documents.length - 1].updatedAt.toISOString() : date.toISOString(),
      }
    };
  }

  @Post()
  async push(@Body() body: { users: Array<{ id: string; email: string; name?: string; householdIds: string[] }> }) {
    await this.usersService.push(body.users);
    return { success: true };
  }
}
