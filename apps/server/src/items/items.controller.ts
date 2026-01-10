import { Body, Controller, Get, Query, Patch, Param, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ItemsService } from './items.service';
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

  // Phase 2 endpoints
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
