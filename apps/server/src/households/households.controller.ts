import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { Household } from '@prisma/client';

@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get()
  async pull(@Query('minUpdatedAt') minUpdatedAt?: string) {
    const date = minUpdatedAt ? new Date(minUpdatedAt) : new Date(0);
    const documents = await this.householdsService.pull(date);
    return {
      documents,
      checkpoint: {
        updatedAt: documents.length > 0 ? documents[documents.length - 1].updatedAt.toISOString() : date.toISOString(),
      }
    };
  }

  @Post()
  async push(@Body() body: { households: Household[] }) {
    await this.householdsService.push(body.households);
    return { success: true };
  }
}
