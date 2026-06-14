import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessService } from '../shared/access.service';
import { NotificationService } from '../shared/notification.service';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private notify: NotificationService,
  ) {}

  async getSections(storeId: string, userId: string) {
    await this.access.verifyStoreAccess(storeId, userId);

    return this.prisma.section.findMany({
      where: { storeId, deleted: false },
      orderBy: { order: 'asc' },
    });
  }

  async createSection(dto: CreateSectionDto, userId: string) {
    await this.access.verifyStoreAccess(dto.storeId, userId);

    // If order is provided, shift everything down (only non-deleted sections)
    if (dto.order !== undefined) {
      await this.prisma.section.updateMany({
        where: {
          storeId: dto.storeId,
          deleted: false,
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
        where: { storeId: dto.storeId, deleted: false },
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

    this.notify.byStore(dto.storeId, ['section'], 'section-mutation');

    return section;
  }

  async updateSection(sectionId: string, dto: UpdateSectionDto, userId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, deleted: false },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.access.verifyStoreAccess(section.storeId, userId);

    await this.prisma.section.update({
      where: { id: sectionId },
      data: { name: dto.name },
    });

    this.notify.byStore(section.storeId, ['section'], 'section-mutation');

    return { success: true };
  }

  async deleteSection(sectionId: string, userId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, deleted: false },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.access.verifyStoreAccess(section.storeId, userId);

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Replicate onDelete: SetNull — null out sectionId on non-deleted items
      await tx.item.updateMany({
        where: { sectionId, deleted: false },
        data: { sectionId: null }
      });

      await tx.section.update({
        where: { id: sectionId },
        data: { deleted: true, deletedAt: now }
      });
    });

    this.notify.byStore(section.storeId, ['section'], 'section-mutation');

    return { success: true };
  }

  async reorderSections(storeId: string, dto: ReorderSectionsDto, userId: string) {
    await this.access.verifyStoreAccess(storeId, userId);

    // Security check: verify all IDs belong to the store and are not deleted
    const count = await this.prisma.section.count({
      where: {
        id: { in: dto.orderedIds },
        storeId: storeId,
        deleted: false,
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

    this.notify.byStore(storeId, ['section'], 'section-mutation');

    return { success: true };
  }
}
