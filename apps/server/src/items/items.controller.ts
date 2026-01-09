import { Body, Controller, Get, Post, Query, Patch, Param, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { Item } from '../generated/prisma/client';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class UpdateItemDto {
  name: string;
  sectionId?: string;
  defaultUnit?: string;
}

export class SearchItemsDto {
  storeId: string;
  query: string;
}

export class GetTopItemsDto {
  storeId: string;
  limit?: number;
  threshold?: number;
}

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // Legacy sync endpoints (keep for now)
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

  // New Phase 2 endpoints
  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateItem(
    @Param('id') itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemsService.updateItem(itemId, dto, user.sub);
  }

  @Get('search')
  @UseGuards(AuthGuard)
  async searchItems(
    @Query() dto: SearchItemsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemsService.searchItems(dto, user.sub);
  }

  @Get('top')
  @UseGuards(AuthGuard)
  async getTopItems(
    @CurrentUser() user: JwtPayload,
    @Query('storeId') storeId: string,
    @Query('limit') limit?: string,
    @Query('threshold') threshold?: string,
  ) {
    return this.itemsService.getTopItems(
      {
        storeId,
        limit: limit ? parseInt(limit) : 5,
        threshold: threshold ? parseInt(threshold) : 1,
      },
      user.sub,
    );
  }
}
