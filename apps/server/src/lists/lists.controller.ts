import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ListsService } from './lists.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class AddItemDto {
  @IsString()
  @IsNotEmpty()
  listId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sectionId?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class ToggleItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsBoolean()
  isChecked: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  purchasedQuantity?: number;
}

export class UpdateQuantityDto {
  @IsString()
  @IsNotEmpty()
  listItemId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class RemoveItemDto {
  @IsString()
  @IsNotEmpty()
  listItemId: string;
}

export class ListIdDto {
  @IsString()
  @IsNotEmpty()
  listId: string;
}

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
