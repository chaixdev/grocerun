import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(
    private prisma: PrismaService,
    private sseBroadcast: SseBroadcastService,
  ) {}

  async getSections(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    return this.prisma.section.findMany({
      where: { storeId, deleted: false },
      orderBy: { order: 'asc' },
    });
  }

  async createSection(dto: CreateSectionDto, userId: string) {
    await this.verifyStoreAccess(dto.storeId, userId);

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

    this.notifyHouseholdMembers(dto.storeId);

    return section;
  }

  async updateSection(sectionId: string, dto: UpdateSectionDto, userId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, deleted: false },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyStoreAccess(section.storeId, userId);

    await this.prisma.section.update({
      where: { id: sectionId },
      data: { name: dto.name },
    });

    this.notifyHouseholdMembers(section.storeId);

    return { success: true };
  }

  async deleteSection(sectionId: string, userId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, deleted: false },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyStoreAccess(section.storeId, userId);

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

    this.notifyHouseholdMembers(section.storeId);

    return { success: true };
  }

  async reorderSections(storeId: string, dto: ReorderSectionsDto, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

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

    this.notifyHouseholdMembers(storeId);

    return { success: true };
  }

  private async verifyStoreAccess(storeId: string, userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deleted: false },
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

  /**
   * Fire-and-forget: resolve all household members for the store and
   * send a RESYNC event to their open SSE connections.
   */
  private notifyHouseholdMembers(storeId: string) {
    this.prisma.store
      .findUnique({
        where: { id: storeId },
        select: {
          household: {
            select: {
              users: { select: { id: true } },
            },
          },
        },
      })
      .then((store) => {
        if (store) {
          const userIds = store.household.users.map((u) => u.id);
          this.sseBroadcast.notify(userIds);
        }
      })
      .catch(() => {
        // Best-effort — don't fail the mutation if notification fails
      });
  }
}
