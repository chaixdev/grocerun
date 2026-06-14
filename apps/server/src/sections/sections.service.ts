import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CreateSectionDto = {
  name: string;
  storeId: string;
  order?: number;
}

type UpdateSectionDto = {
  name: string;
}

type ReorderSectionsDto = {
  orderedIds: string[];
}

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async getSections(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    return this.prisma.section.findMany({
      where: { storeId },
      orderBy: { order: 'asc' },
    });
  }

  async createSection(dto: CreateSectionDto, userId: string) {
    await this.verifyStoreAccess(dto.storeId, userId);

    // If order is provided, shift everything down
    if (dto.order !== undefined) {
      await this.prisma.section.updateMany({
        where: {
          storeId: dto.storeId,
          order: { gte: dto.order },
        },
        data: {
          order: { increment: 1 },
        },
      });
    }

    // Get max order if not provided
    let newOrder = dto.order;
    if (newOrder === undefined) {
      const lastSection = await this.prisma.section.findFirst({
        where: { storeId: dto.storeId },
        orderBy: { order: 'desc' },
      });
      newOrder = (lastSection?.order ?? -1) + 1;
    }

    const section = await this.prisma.section.create({
      data: {
        name: dto.name,
        storeId: dto.storeId,
        order: newOrder,
      },
    });

    return section;
  }

  async updateSection(sectionId: string, dto: UpdateSectionDto, userId: string) {
    // Find section to get storeId for access verification
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyStoreAccess(section.storeId, userId);

    await this.prisma.section.update({
      where: { id: sectionId },
      data: { name: dto.name },
    });

    return { success: true };
  }

  async deleteSection(sectionId: string, userId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyStoreAccess(section.storeId, userId);

    await this.prisma.section.delete({ where: { id: sectionId } });

    return { success: true };
  }

  async reorderSections(storeId: string, dto: ReorderSectionsDto, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    // Security check: verify all IDs belong to the store
    const count = await this.prisma.section.count({
      where: {
        id: { in: dto.orderedIds },
        storeId: storeId
      }
    });

    if (count !== dto.orderedIds.length) {
      throw new BadRequestException('Invalid section ids for store');
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.section.update({
          where: { id, storeId }, // Ensure cross-store updates are impossible
          data: { order: index },
        })
      )
    );

    return { success: true };
  }

  private async verifyStoreAccess(storeId: string, userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        household: {
          select: {
            users: {
              where: { id: userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.household.users.length === 0) {
      throw new ForbiddenException('Access denied');
    }
  }
}
