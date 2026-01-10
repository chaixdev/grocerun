import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ArrayNotEmpty } from 'class-validator';
import { SectionsService } from './sections.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class ReorderSectionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds: string[];
}

@Controller('sections')
@UseGuards(AuthGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get('store/:storeId')
  async getSections(
    @Param('storeId') storeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.getSections(storeId, user.sub);
  }

  @Post()
  async createSection(
    @Body() dto: CreateSectionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.createSection(dto, user.sub);
  }

  @Patch(':id')
  async updateSection(
    @Param('id') sectionId: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.updateSection(sectionId, dto, user.sub);
  }

  @Delete(':id')
  async deleteSection(
    @Param('id') sectionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.deleteSection(sectionId, user.sub);
  }

  @Post('store/:storeId/reorder')
  async reorderSections(
    @Param('storeId') storeId: string,
    @Body() dto: ReorderSectionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sectionsService.reorderSections(storeId, dto, user.sub);
  }
}
