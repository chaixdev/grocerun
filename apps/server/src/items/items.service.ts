import { z } from 'zod'; // Import z from zod
import { SearchItemsSchema } from '@grocerun/dto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessService } from '../shared/access.service';
import { NotificationService } from '../shared/notification.service';
import { UpdateItemDto } from './dto/update-item.dto';

type SearchItemsParams = z.infer<typeof SearchItemsSchema>;

type GetTopItemsDto = {
  storeId: string;
  limit: number;
  threshold: number;
}

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private notify: NotificationService,
  ) {}

  async updateItem(itemId: string, dto: UpdateItemDto, userId: string) {
    // 1. Get item to obtain storeId, then verify access via shared service
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted: false },
      select: { storeId: true },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.access.verifyStoreAccess(item.storeId, userId);

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
    this.notify.byStore(item.storeId, ['item'], 'item-updated');

    return { status: 'UPDATED' };
  }

  async searchItems(dto: SearchItemsParams, userId: string) {
    // Verify access to store
    await this.access.verifyStoreAccess(dto.storeId, userId);

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
    await this.access.verifyStoreAccess(dto.storeId, userId);

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

}
