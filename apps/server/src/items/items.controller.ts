import { Body, Controller, Get, Query, Patch, Param, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateItemDto } from './dto/update-item.dto';
import { SearchItemsDto, GetTopItemsDto } from './dto/query-items.dto';

@Controller('items')
@UseGuards(AuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Patch(':id')
  async updateItem(
    @Param('id') itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemsService.updateItem(itemId, dto, user.userId!);
  }

  @Get('search')
  async searchItems(
    @Query() dto: SearchItemsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemsService.searchItems(dto, user.userId!);
  }

  @Get('top')
  async getTopItems(
    @CurrentUser() user: JwtPayload,
    @Query() dto: GetTopItemsDto,
  ) {
    return this.itemsService.getTopItems(dto, user.userId!);
  }
}
