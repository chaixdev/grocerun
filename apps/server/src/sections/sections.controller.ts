import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto/section.dto';

@Controller('sections')
@UseGuards(AuthGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get('store/:storeId')
  async getSections(
    @Param('storeId') storeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.getSections(storeId, user.userId!);
  }

  @Post()
  async createSection(
    @Body() dto: CreateSectionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.createSection(dto, user.userId!);
  }

  @Patch(':id')
  async updateSection(
    @Param('id') sectionId: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.updateSection(sectionId, dto, user.userId!);
  }

  @Delete(':id')
  async deleteSection(
    @Param('id') sectionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.deleteSection(sectionId, user.userId!);
  }

  @Post('store/:storeId/reorder')
  async reorderSections(
    @Param('storeId') storeId: string,
    @Body() dto: ReorderSectionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.reorderSections(storeId, dto, user.userId!);
  }
}
