import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ItemsService } from './items.service';
import { Item } from '@prisma/client';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async pull(@Query('minUpdatedAt') minUpdatedAt?: string) {
    const date = minUpdatedAt ? new Date(minUpdatedAt) : new Date(0);
    const documents = await this.itemsService.pull(date);
    return {
      documents,
      checkpoint: {
        updatedAt: documents.length > 0 ? documents[documents.length - 1].updatedAt.toISOString() : date.toISOString(),
      }
    };
  }

  @Post()
  async push(@Body() body: { items: Item[] }) {
    await this.itemsService.push(body.items);
    return { success: true };
  }
}
