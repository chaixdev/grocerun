import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { CreateListDto } from './dto/create-list.dto';
import { AddItemDto } from './dto/add-item.dto';
import { ToggleItemDto, UpdateQuantityDto } from './dto/manage-items.dto';

type AddItemResult =
  | { status: 'ADDED'; listItem: any }
  | { status: 'ALREADY_EXISTS' }
  | { status: 'NEEDS_SECTION' }
  | { status: 'ERROR'; error: string };

@Injectable()
export class ListsService {
  constructor(
    private prisma: PrismaService,
    private sseBroadcast: SseBroadcastService,
  ) {}

  async createList(dto: CreateListDto, userId: string) {
    await this.verifyStoreAccess(dto.storeId, userId);

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
        name: dto.name || 'Shopping List',
        storeId: dto.storeId,
      },
    });

    this.notifyHouseholdMembers(dto.storeId);

    return list;
  }

  async getLists(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

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
    await this.verifyStoreAccess(storeId, userId);

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

    await this.verifyStoreAccess(list.storeId, userId);

    return list;
  }

  async addItemToList(dto: AddItemDto, userId: string): Promise<AddItemResult> {
    const { listId, name, sectionId, quantity = 1, unit } = dto;

    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false }
    });
    if (!list) {
      return { status: 'ERROR', error: 'List not found' };
    }

    if (list.status === 'COMPLETED') {
      return { status: 'ERROR', error: 'List is completed' };
    }

    await this.verifyStoreAccess(list.storeId, userId);
    this.assertCanMutateShoppingList(list, userId);

    // 1. Check if item exists in catalog (not deleted)
    let item = await this.prisma.item.findFirst({
      where: {
        storeId: list.storeId,
        name: name,
        deleted: false,
      }
    });

    // 2. If item exists, add to list
    if (item) {
      // Update default unit if provided
      if (unit && unit !== item.defaultUnit) {
        await this.prisma.item.update({
          where: { id: item.id },
          data: { defaultUnit: unit }
        });
      }

      // Check if already in list (not deleted)
      const existingListItem = await this.prisma.listItem.findFirst({
        where: {
          listId,
          itemId: item.id,
          deleted: false,
        }
      });

      if (existingListItem) {
        return { status: 'ALREADY_EXISTS' };
      }

      // Upsert to resurrect a soft-deleted ListItem row with the same (listId, itemId).
      const listItem = await this.prisma.listItem.upsert({
        where: { listId_itemId: { listId, itemId: item.id } },
        update: {
          deleted: false,
          deletedAt: null,
          quantity,
          unit: unit || item.defaultUnit,
          isChecked: false,
          purchasedQuantity: null,
        },
        create: {
          listId,
          itemId: item.id,
          quantity,
          unit: unit || item.defaultUnit,
        },
        include: { item: true }
      });

      this.notifyHouseholdMembers(list.storeId);

      return { status: 'ADDED', listItem };
    }

    // 3. If item is new and sectionId not provided, ask for it
    if (sectionId === undefined) {
      return { status: 'NEEDS_SECTION' };
    }

    // Create item (with or without section).
    // Use upsert to handle the case where a soft-deleted item with the same name exists —
    // resurrecting it avoids a unique constraint violation on (storeId, name).
    item = await this.prisma.item.upsert({
      where: { storeId_name: { storeId: list.storeId, name } },
      update: {
        deleted: false,
        deletedAt: null,
        sectionId: sectionId ?? null,
        defaultUnit: unit ?? null,
      },
      create: {
        name,
        storeId: list.storeId,
        sectionId: sectionId,
        defaultUnit: unit,
      }
    });

    // Upsert to resurrect a soft-deleted ListItem row with the same (listId, itemId).
    const listItem = await this.prisma.listItem.upsert({
      where: { listId_itemId: { listId, itemId: item.id } },
      update: {
        deleted: false,
        deletedAt: null,
        quantity,
        unit,
        isChecked: false,
        purchasedQuantity: null,
      },
      create: {
        listId,
        itemId: item.id,
        quantity,
        unit,
      },
      include: { item: true }
    });

    this.notifyHouseholdMembers(list.storeId);

    return { status: 'ADDED', listItem };
  }

  async toggleListItem(dto: ToggleItemDto, userId: string) {
    const { itemId, isChecked, purchasedQuantity } = dto;

    const listItem = await this.prisma.listItem.findFirst({
      where: { id: itemId, deleted: false },
      include: { list: true }
    });

    if (!listItem) {
      throw new NotFoundException('Item not found');
    }

    if (listItem.list.status === 'COMPLETED') {
      throw new BadRequestException('List is completed');
    }

    await this.verifyStoreAccess(listItem.list.storeId, userId);
    this.assertCanMutateShoppingList(listItem.list, userId);

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
      where: { id: itemId },
      data: {
        isChecked,
        purchasedQuantity: finalPurchasedQuantity
      }
    });

    this.notifyHouseholdMembers(listItem.list.storeId);

    return { success: true };
  }

  async updateListItemQuantity(dto: UpdateQuantityDto, userId: string) {
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

    await this.verifyStoreAccess(listItem.list.storeId, userId);
    this.assertCanMutateShoppingList(listItem.list, userId);

    await this.prisma.listItem.update({
      where: { id: listItemId },
      data: {
        quantity,
        ...(unit !== undefined ? { unit } : {})
      }
    });

    this.notifyHouseholdMembers(listItem.list.storeId);

    return { success: true };
  }

  async removeItemFromList(listItemId: string, userId: string) {
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

    await this.verifyStoreAccess(listItem.list.storeId, userId);
    this.assertCanMutateShoppingList(listItem.list, userId);

    await this.prisma.listItem.update({
      where: { id: listItemId },
      data: { deleted: true, deletedAt: new Date() }
    });

    this.notifyHouseholdMembers(listItem.list.storeId);

    return { success: true };
  }

  async completeList(listId: string, userId: string) {
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

    await this.verifyStoreAccess(list.storeId, userId);
    this.assertShoppingLockHolder(list, userId, 'Only the shopping lock holder can complete this list');

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

    this.notifyHouseholdMembers(list.storeId);

    return { success: true };
  }

  async startShopping(listId: string, userId: string) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.verifyStoreAccess(list.storeId, userId);

    if (list.status !== 'PLANNING') {
      if (list.status === 'SHOPPING' && list.assignedTo && list.assignedTo !== userId) {
        throw new ConflictException('List is already being shopped by another household member');
      }
      throw new BadRequestException('List must be in PLANNING state to start shopping');
    }

    await this.prisma.list.update({
      where: { id: listId },
      data: { status: 'SHOPPING', assignedTo: userId }
    });

    this.notifyHouseholdMembers(list.storeId);

    return { success: true };
  }

  async cancelShopping(listId: string, userId: string) {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, deleted: false },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.verifyStoreAccess(list.storeId, userId);

    if (list.status !== 'SHOPPING') {
      throw new BadRequestException('List must be in SHOPPING state to cancel');
    }

    this.assertShoppingLockHolder(list, userId, 'Only the shopping lock holder can cancel shopping');

    await this.prisma.list.update({
      where: { id: listId },
      data: { status: 'PLANNING', assignedTo: null }
    });

    this.notifyHouseholdMembers(list.storeId);

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

  private assertCanMutateShoppingList(
    list: { status: string; assignedTo?: string | null },
    userId: string,
  ) {
    if (list.status === 'SHOPPING') {
      this.assertShoppingLockHolder(list, userId, 'This list is locked by another shopper');
    }
  }

  private assertShoppingLockHolder(
    list: { status: string; assignedTo?: string | null },
    userId: string,
    message: string,
  ) {
    if (list.status !== 'SHOPPING') return;
    if (!list.assignedTo) {
      throw new ConflictException('Shopping lock is missing. Refresh and try again.');
    }
    if (list.assignedTo !== userId) {
      throw new ForbiddenException(message);
    }
  }

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
          this.sseBroadcast.notify(store.household.users.map((u) => u.id));
        }
      })
      .catch(() => {
        // Best-effort — don't fail the mutation if notification fails
      });
  }
}
