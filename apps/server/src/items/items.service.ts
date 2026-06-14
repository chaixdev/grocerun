import { z } from 'zod'; // Import z from zod
import { SearchItemsSchema } from '@grocerun/dto';

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateItemDto } from './dto/update-item.dto';
import { SseBroadcastService } from '../sync/sse-broadcast.service';

type SearchItemsParams = z.infer<typeof SearchItemsSchema>;

type GetTopItemsDto = {
  storeId: string;
  limit: number;
  threshold: number;
}

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    private prisma: PrismaService,
    private sseBroadcast: SseBroadcastService,
  ) {}

  // Phase 2 methods
  async updateItem(itemId: string, dto: UpdateItemDto, userId: string) {
    // 1. Get item and verify access
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted: false },
      select: {
        storeId: true,
        store: {
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
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.store.household.users.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    // 2. Update the item
    await this.prisma.item.update({
      where: { id: itemId },
      data: {
        name: dto.name,
        sectionId: dto.sectionId || null,
        defaultUnit: dto.defaultUnit || null,
      },
    });

    // 3. Notify other household members via SSE (fire-and-forget —
    //    failure must never block the REST response).
    try {
      const storeWithHousehold = await this.prisma.store.findUnique({
        where: { id: item.storeId },
        select: { household: { select: { users: { select: { id: true } } } } },
      });
      const memberIds = storeWithHousehold?.household?.users?.map(u => u.id) ?? [];
      this.sseBroadcast.notifyChanged(memberIds, {
        collections: ['item'],
        reason: 'item-updated',
      });
    } catch (err) {
      this.logger.error('Failed to notify household members about item update', err);
    }

    return { status: 'UPDATED' };
  }

  async searchItems(dto: SearchItemsParams, userId: string) {
    // Verify access to store
    await this.verifyStoreAccess(dto.storeId, userId);

    // SQLite raw query for case-insensitive search
    const likePattern = `%${dto.query}%`;

    const items = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sectionId: string | null;
        defaultUnit: string | null;
        purchaseCount: number;
      }>
    >`
      SELECT id, name, sectionId, defaultUnit, purchaseCount
      FROM Item
      WHERE storeId = ${dto.storeId}
        AND deleted = 0
        AND LOWER(name) LIKE LOWER(${likePattern})
      ORDER BY purchaseCount DESC, name ASC
      LIMIT 10
    `;

    return items;
  }

  async getTopItems(dto: GetTopItemsDto, userId: string) {
    // Verify access to store
    await this.verifyStoreAccess(dto.storeId, userId);

    const items = await this.prisma.item.findMany({
      where: {
        storeId: dto.storeId,
        deleted: false,
        purchaseCount: {
          gte: dto.threshold,
        },
      },
      orderBy: {
        purchaseCount: 'desc',
      },
      take: dto.limit,
      select: {
        id: true,
        name: true,
        sectionId: true,
        defaultUnit: true,
        purchaseCount: true,
      },
    });

    return items;
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
}
