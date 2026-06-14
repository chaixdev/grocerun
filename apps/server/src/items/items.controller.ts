import { Body, Controller, Get, Query, Patch, Param, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateItemDto } from './dto/update-item.dto';
import { SearchItemsDto } from './dto/query-items.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateItem(
    @Param('id') itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemsService.updateItem(itemId, dto, user.userId!);
  }

  @Get('search')
  @UseGuards(AuthGuard)
  async searchItems(
    @Query() dto: SearchItemsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemsService.searchItems(dto, user.userId!);
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
      user.userId!,
    );
  }
}
