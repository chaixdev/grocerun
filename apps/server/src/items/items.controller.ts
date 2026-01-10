import { Body, Controller, Get, Post, Query, Patch, Param, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ItemsService } from './items.service';
import { Item } from '../generated/prisma/client';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class UpdateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsString()
  @IsOptional()
  defaultUnit?: string;
}

export class SearchItemsDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  query: string;
}

export class GetTopItemsDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  threshold?: number;
}

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // Legacy sync endpoints (secured)
  @Get()
  @UseGuards(AuthGuard)
  async pull(
    @Query('minUpdatedAt') minUpdatedAt?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
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
  @UseGuards(AuthGuard)
  async push(
    @Body() body: { items: Item[] },
    @CurrentUser() user?: JwtPayload,
  ) {
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
