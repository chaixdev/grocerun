import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
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
  constructor(private prisma: PrismaService) {}

  async createList(dto: CreateListDto, userId: string) {
    await this.verifyStoreAccess(dto.storeId, userId);

    const existingList = await this.prisma.list.findFirst({
      where: {
        storeId: dto.storeId,
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

    return list;
  }

  async getLists(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    return this.prisma.list.findMany({
      where: { storeId },
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
        status: {
          not: 'COMPLETED'
        }
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
  }

  async getList(listId: string, userId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: {
        store: {
          include: {
            sections: {
              orderBy: { order: 'asc' }
            }
          }
        },
        items: {
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

    const list = await this.prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
      return { status: 'ERROR', error: 'List not found' };
    }

    if (list.status === 'COMPLETED') {
      return { status: 'ERROR', error: 'List is completed' };
    }

    await this.verifyStoreAccess(list.storeId, userId);

    // 1. Check if item exists in catalog
    let item = await this.prisma.item.findUnique({
      where: {
        storeId_name: {
          storeId: list.storeId,
          name: name,
        }
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

      // Check if already in list
      const existingListItem = await this.prisma.listItem.findUnique({
        where: {
          listId_itemId: {
            listId,
            itemId: item.id
          }
        }
      });

      if (existingListItem) {
        return { status: 'ALREADY_EXISTS' };
      }

      const listItem = await this.prisma.listItem.create({
        data: {
          listId,
          itemId: item.id,
          quantity,
          unit: unit || item.defaultUnit,
        },
        include: { item: true }
      });

      return { status: 'ADDED', listItem };
    }

    // 3. If item is new and sectionId not provided, ask for it
    if (sectionId === undefined) {
      return { status: 'NEEDS_SECTION' };
    }

    // Create item (with or without section)
    item = await this.prisma.item.create({
      data: {
        name,
        storeId: list.storeId,
        sectionId: sectionId,
        defaultUnit: unit,
      }
    });

    const listItem = await this.prisma.listItem.create({
      data: {
        listId,
        itemId: item.id,
        quantity,
        unit,
      },
      include: { item: true }
    });

    return { status: 'ADDED', listItem };
  }

  async toggleListItem(dto: ToggleItemDto, userId: string) {
    const { itemId, isChecked, purchasedQuantity } = dto;

    const listItem = await this.prisma.listItem.findUnique({
      where: { id: itemId },
      include: { list: true }
    });

    if (!listItem) {
      throw new NotFoundException('Item not found');
    }

    if (listItem.list.status === 'COMPLETED') {
      throw new BadRequestException('List is completed');
    }

    await this.verifyStoreAccess(listItem.list.storeId, userId);

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

    return { success: true };
  }

  async updateListItemQuantity(dto: UpdateQuantityDto, userId: string) {
    const { listItemId, quantity, unit } = dto;

    const listItem = await this.prisma.listItem.findUnique({
      where: { id: listItemId },
      include: { list: true }
    });

    if (!listItem) {
      throw new NotFoundException('Item not found');
    }

    if (listItem.list.status === 'COMPLETED') {
      throw new BadRequestException('List is completed');
    }

    await this.verifyStoreAccess(listItem.list.storeId, userId);

    await this.prisma.listItem.update({
      where: { id: listItemId },
      data: {
        quantity,
        ...(unit !== undefined ? { unit } : {})
      }
    });

    return { success: true };
  }

  async removeItemFromList(listItemId: string, userId: string) {
    const listItem = await this.prisma.listItem.findUnique({
      where: { id: listItemId },
      include: { list: true }
    });

    if (!listItem) {
      throw new NotFoundException('Item not found');
    }

    if (listItem.list.status === 'COMPLETED') {
      throw new BadRequestException('List is completed');
    }

    await this.verifyStoreAccess(listItem.list.storeId, userId);

    await this.prisma.listItem.delete({
      where: { id: listItemId }
    });

    return { success: true };
  }

  async completeList(listId: string, userId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: { items: true }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (list.status === 'COMPLETED') {
      throw new BadRequestException('List is already completed');
    }

    await this.verifyStoreAccess(list.storeId, userId);

    // Update list status and item stats in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Mark list as completed
      await tx.list.update({
        where: { id: listId },
        data: { status: 'COMPLETED' }
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

    return { success: true };
  }

  async startShopping(listId: string, userId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.verifyStoreAccess(list.storeId, userId);

    if (list.status !== 'PLANNING') {
      throw new BadRequestException('List must be in PLANNING state to start shopping');
    }

    await this.prisma.list.update({
      where: { id: listId },
      data: { status: 'SHOPPING' }
    });

    return { success: true };
  }

  async cancelShopping(listId: string, userId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.verifyStoreAccess(list.storeId, userId);

    if (list.status !== 'SHOPPING') {
      throw new BadRequestException('List must be in SHOPPING state to cancel');
    }

    await this.prisma.list.update({
      where: { id: listId },
      data: { status: 'PLANNING' }
    });

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
