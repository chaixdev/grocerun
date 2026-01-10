import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Controller('stores')
@UseGuards(AuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async getStores(
    @Query('householdId') householdId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storesService.getStores(householdId, user.sub);
  }

  @Get(':id')
  async getStore(
    @Param('id') storeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storesService.getStore(storeId, user.sub);
  }

  @Post()
  async createStore(
    @Body() dto: CreateStoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storesService.createStore(dto, user.sub);
  }

  @Patch(':id')
  async updateStore(
    @Param('id') storeId: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storesService.updateStore(storeId, dto, user.sub);
  }

  @Delete(':id')
  async deleteStore(
    @Param('id') storeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.storesService.deleteStore(storeId, user.sub);
  }
}
