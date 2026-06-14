import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ListsService } from './lists.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateListDto } from './dto/create-list.dto';
import { AddItemDto } from './dto/add-item.dto';
import { ToggleItemDto, UpdateQuantityDto, RemoveItemDto, ListIdDto } from './dto/manage-items.dto';

@Controller('lists')
@UseGuards(AuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  async createList(
    @Body() dto: CreateListDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.createList(dto, user.sub);
  }

  @Get('store/:storeId')
  async getLists(
    @Param('storeId') storeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.getLists(storeId, user.sub);
  }

  @Get('store/:storeId/active')
  async getActiveListForStore(
    @Param('storeId') storeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.getActiveListForStore(storeId, user.sub);
  }

  @Get(':listId')
  async getList(
    @Param('listId') listId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.getList(listId, user.sub);
  }

  @Post('items/add')
  async addItemToList(
    @Body() dto: AddItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.addItemToList(dto, user.sub);
  }

  @Patch('items/toggle')
  async toggleListItem(
    @Body() dto: ToggleItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.toggleListItem(dto, user.sub);
  }

  @Patch('items/quantity')
  async updateListItemQuantity(
    @Body() dto: UpdateQuantityDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.updateListItemQuantity(dto, user.sub);
  }

  @Delete('items/:listItemId')
  async removeItemFromList(
    @Param('listItemId') listItemId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.removeItemFromList(listItemId, user.sub);
  }

  @Post(':listId/complete')
  async completeList(
    @Param('listId') listId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.completeList(listId, user.sub);
  }

  @Post(':listId/start-shopping')
  async startShopping(
    @Param('listId') listId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.startShopping(listId, user.sub);
  }

  @Post(':listId/cancel-shopping')
  async cancelShopping(
    @Param('listId') listId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listsService.cancelShopping(listId, user.sub);
  }
}
