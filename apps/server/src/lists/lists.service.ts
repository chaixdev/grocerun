import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessService } from '../shared/access.service';
import { SseSyncBroadcastService } from '../shared/sse-sync-broadcast.service';
import { CreateListDto } from './dto/create-list.dto';
import { AddItemDto } from './dto/add-item.dto';
import { ToggleItemDto, UpdateQuantityDto } from './dto/manage-items.dto';

export interface ListItemWithItem {
  id: string;
  listId: string;
  itemId: string;
  isChecked: boolean;
  quantity: number;
  unit: string | null;
  purchasedQuantity: number | null;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedAt: Date | null;
  item: {
    id: string;
    name: string;
    storeId: string;
    sectionId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deleted: boolean;
    deletedAt: Date | null;
    purchaseCount: number;
    lastPurchased: Date | null;
    defaultUnit: string | null;
    note: string | null;
  };
}

@Injectable()
export class ListsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private sseSyncBroadcast: SseSyncBroadcastService,
  ) {}

  async createList(dto: CreateListDto, userId: string) {
    await this.access.verifyStoreAccess(dto.storeId, userId);

    const existingList = await this.prisma.list.findFirst({
      where: {
        storeId: dto.storeId,
        deleted: false,
        status: { not: 'COMPLETED' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingList) {
      return existingList;
    }

    const list = await this.prisma.list.create({
      data: {
        name: dto.name,
        storeId: dto.storeId,
      },
    });

    this.sseSyncBroadcast.byStore(dto.storeId, ['list', 'listItem'], 'list-mutation');

    return list;
  }

  async getLists(storeId: string, userId: string) {
    await this.access.verifyStoreAccess(storeId, userId);

    return this.prisma.list.findMany({
      where: { storeId, deleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  }

  async getActiveListForStore(storeId: string, userId: string) {
    await this.access.verifyStoreAccess(storeId, userId);

    return this.prisma.list.findFirst({
      where: {
        storeId,
        deleted: false,
        status: {
          not: 'COMPLETED'
        }
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
  }

  async getList(listId: string, userId: string) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false },
      include: {
        store: {
          include: {
            sections: {
              where: { deleted: false },
              orderBy: { order: 'asc' }
            }
          }
        },
        items: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
          include: {
            item: true
          }
        }
      }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.access.verifyStoreAccess(list.storeId, userId);

    return list;
  }

  async addItemToList(dto: AddItemDto, userId: string, assignedToId: string): Promise<ListItemWithItem> {
    const { listId, name, sectionId, quantity = 1, unit } = dto;

    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false }
    });
    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.access.verifyStoreAccess(list.storeId, userId);
    this.access.assertShoppingLock(list, assignedToId);

    // Run the entire add-item flow inside a transaction to eliminate TOCTOU
    // races between the existence checks and the create/restore operations.
    const listItem = await this.prisma.$transaction(async (tx) => {
      // 1. Check if item exists in catalog (not deleted)
      let item = await tx.item.findFirst({
        where: {
          storeId: list.storeId,
          name: name,
          deleted: false,
        }
      });

      // ---- Item already exists in catalog ----
      if (item) {
        // Auto-learn default unit
        if (unit && unit !== item.defaultUnit) {
          await tx.item.update({
            where: { id: item.id },
            data: { defaultUnit: unit }
          });
        }

        // Check if already in list (not deleted)
        const existingListItem = await tx.listItem.findFirst({
          where: { listId, itemId: item.id, deleted: false }
        });
        if (existingListItem) {
          throw new ConflictException('Item already in list');
        }

        // Restore soft-deleted row if it exists
        const softDeletedLI = await tx.listItem.findFirst({
          where: { listId, itemId: item.id, deleted: true },
        });
        if (softDeletedLI) {
          return tx.listItem.update({
            where: { id: softDeletedLI.id },
            data: { deleted: false, deletedAt: null, quantity, unit: unit || item.defaultUnit, isChecked: false, purchasedQuantity: null },
            include: { item: true },
          });
        }

        // Create new
        return tx.listItem.create({
          data: { listId, itemId: item.id, quantity, unit: unit || item.defaultUnit },
          include: { item: true },
        });
      }

      // ---- New item: sectionId required ----
      if (sectionId === undefined) {
        throw new BadRequestException({
          statusCode: 400,
          code: 'NEEDS_SECTION',
          message: 'Section selection required for new catalog item',
        });
      }

      // Create item (with or without section)
      const softDeletedItem = await tx.item.findFirst({
        where: { storeId: list.storeId, name, deleted: true },
      });
      if (softDeletedItem) {
        item = await tx.item.update({
          where: { id: softDeletedItem.id },
          data: { deleted: false, deletedAt: null, sectionId: sectionId ?? null, defaultUnit: unit ?? null },
        });
      } else {
        item = await tx.item.create({
          data: { name, storeId: list.storeId, sectionId: sectionId, defaultUnit: unit },
        });
      }

      // Restore soft-deleted list item or create new
      const softDeletedLI2 = await tx.listItem.findFirst({
        where: { listId, itemId: item.id, deleted: true },
      });
      if (softDeletedLI2) {
        return tx.listItem.update({
          where: { id: softDeletedLI2.id },
          data: { deleted: false, deletedAt: null, quantity, unit, isChecked: false, purchasedQuantity: null },
          include: { item: true },
        });
      }
      return tx.listItem.create({
        data: { listId, itemId: item.id, quantity, unit },
        include: { item: true },
      });
    });

    this.sseSyncBroadcast.byStore(list.storeId, ['list', 'listItem'], 'list-mutation');
    return listItem;
  }

  async toggleListItem(dto: ToggleItemDto, userId: string, assignedToId: string) {
    const { listItemId, isChecked, purchasedQuantity } = dto;

    const listItem = await this.prisma.listItem.findFirst({
      where: { id: listItemId, deleted: false },
      include: { list: true }
    });

    if (!listItem) {
      throw new NotFoundException('Item not found');
    }

    if (listItem.list.status === 'COMPLETED') {
      throw new BadRequestException('List is completed');
    }

    await this.access.verifyStoreAccess(listItem.list.storeId, userId);
    this.access.assertShoppingLock(listItem.list, assignedToId ?? userId);

    // Business logic: determine final purchasedQuantity
    let finalPurchasedQuantity: number | null | undefined = purchasedQuantity;

    if (finalPurchasedQuantity === undefined) {
      if (isChecked && listItem.purchasedQuantity === null) {
        // Checking, and no previous bought record -> Default to Planned
        finalPurchasedQuantity = listItem.quantity;
      } else {
        // Unchecking OR Checking-with-existing -> Keep existing
        finalPurchasedQuantity = listItem.purchasedQuantity;
      }
    }

    await this.prisma.listItem.update({
      where: { id: listItemId },
      data: {
        isChecked,
        purchasedQuantity: finalPurchasedQuantity
      }
    });

    this.sseSyncBroadcast.byStore(listItem.list.storeId, ['list', 'listItem'], 'list-mutation');

    return { success: true };
  }

  async updateListItemQuantity(dto: UpdateQuantityDto, userId: string, assignedToId: string) {
    const { listItemId, quantity, unit } = dto;

    const listItem = await this.prisma.listItem.findFirst({
      where: { id: listItemId, deleted: false },
      include: { list: true }
    });

    if (!listItem) {
      throw new NotFoundException('Item not found');
    }

    if (listItem.list.status === 'COMPLETED') {
      throw new BadRequestException('List is completed');
    }

    await this.access.verifyStoreAccess(listItem.list.storeId, userId);
    this.access.assertShoppingLock(listItem.list, assignedToId ?? userId);

    await this.prisma.listItem.update({
      where: { id: listItemId },
      data: {
        quantity,
        ...(unit !== undefined ? { unit } : {})
      }
    });

    this.sseSyncBroadcast.byStore(listItem.list.storeId, ['list', 'listItem'], 'list-mutation');

    return { success: true };
  }

  async removeItemFromList(listItemId: string, userId: string, assignedToId: string) {
    const listItem = await this.prisma.listItem.findFirst({
      where: { id: listItemId, deleted: false },
      include: { list: true }
    });

    if (!listItem) {
      throw new NotFoundException('Item not found');
    }

    if (listItem.list.status === 'COMPLETED') {
      throw new BadRequestException('List is completed');
    }

    await this.access.verifyStoreAccess(listItem.list.storeId, userId);
    this.access.assertShoppingLock(listItem.list, assignedToId ?? userId);

    await this.prisma.listItem.update({
      where: { id: listItemId },
      data: { deleted: true, deletedAt: new Date() }
    });

    this.sseSyncBroadcast.byStore(listItem.list.storeId, ['list', 'listItem'], 'list-mutation');

    return { success: true };
  }

  async completeList(listId: string, userId: string, assignedToId: string) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false },
      include: {
        items: {
          where: { deleted: false }
        }
      }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (list.status === 'COMPLETED') {
      throw new BadRequestException('List is already completed');
    }

    await this.access.verifyStoreAccess(list.storeId, userId);
    this.access.assertShoppingLock(list, assignedToId, 'Only the shopping lock holder can complete this list');

    // Update list status and item stats in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Mark list as completed
      await tx.list.update({
        where: { id: listId },
        data: { status: 'COMPLETED', assignedTo: null }
      });

      // 2. Update catalog stats for checked items
      const checkedItems = list.items.filter(i => i.isChecked);
      for (const listItem of checkedItems) {
        await tx.item.update({
          where: { id: listItem.itemId },
          data: {
            purchaseCount: { increment: 1 },
            lastPurchased: new Date()
          }
        });
      }
    });

    this.sseSyncBroadcast.byStore(list.storeId, ['list', 'listItem'], 'list-mutation');

    return { success: true };
  }

  async startShopping(listId: string, userId: string, assignedToId: string) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.access.verifyStoreAccess(list.storeId, userId);

    if (list.status !== 'PLANNING') {
      if (list.status === 'SHOPPING' && list.assignedTo && list.assignedTo !== assignedToId) {
        throw new ConflictException('List is already being shopped by another household member');
      }
      throw new BadRequestException('List must be in PLANNING state to start shopping');
    }

    await this.prisma.list.update({
      where: { id: listId },
      data: { status: 'SHOPPING', assignedTo: assignedToId }
    });

    this.sseSyncBroadcast.byStore(list.storeId, ['list', 'listItem'], 'list-mutation');

    return { success: true };
  }

  async cancelShopping(listId: string, userId: string, assignedToId: string) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.access.verifyStoreAccess(list.storeId, userId);

    if (list.status !== 'SHOPPING') {
      throw new BadRequestException('List must be in SHOPPING state to cancel');
    }

    this.access.assertShoppingLock(list, assignedToId, 'Only the shopping lock holder can cancel shopping');

    await this.prisma.list.update({
      where: { id: listId },
      data: { status: 'PLANNING', assignedTo: null }
    });

    this.sseSyncBroadcast.byStore(list.storeId, ['list', 'listItem'], 'list-mutation');

    return { success: true };
  }}
