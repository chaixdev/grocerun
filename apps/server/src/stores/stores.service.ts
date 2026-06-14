import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
    private sseBroadcast: SseBroadcastService,
  ) {}

  async getStores(householdId: string | undefined, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { households: { where: { deleted: false } } },
    });

    if (!user || user.households.length === 0) return [];

    let targetHouseholdId = householdId;

    // If no specific household requested, or requested one not found in user's list
    if (!targetHouseholdId || !user.households.find((h) => h.id === targetHouseholdId)) {
      targetHouseholdId = user.households[0]?.id;
    }

    const stores = await this.prisma.store.findMany({
      where: { householdId: targetHouseholdId, deleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return stores;
  }

  async getStore(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    return this.prisma.store.findFirst({
      where: { id: storeId, deleted: false },
      select: {
        id: true,
        name: true,
        location: true,
        imageUrl: true,
        householdId: true
      }
    });
  }

  async createStore(dto: CreateStoreDto, userId: string) {
    // Verify access to household
    await this.verifyHouseholdAccess(dto.householdId, userId);

    const store = await this.prisma.store.create({
      data: {
        name: dto.name,
        location: dto.location,
        householdId: dto.householdId,
      },
    });

    this.notifyHouseholdMembers(dto.householdId);

    return store;
  }

  async updateStore(storeId: string, dto: UpdateStoreDto, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        name: dto.name,
        location: dto.location,
        imageUrl: dto.imageUrl,
      }
    });

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { householdId: true } });
    if (store) this.notifyHouseholdMembers(store.householdId);

    return { success: true };
  }

  async deleteStore(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Cascade soft-delete: ListItems → Lists → Items → Sections → Store
      const lists = await tx.list.findMany({
        where: { storeId, deleted: false },
        select: { id: true }
      });
      const listIds = lists.map(l => l.id);

      if (listIds.length > 0) {
        await tx.listItem.updateMany({
          where: { listId: { in: listIds }, deleted: false },
          data: { deleted: true, deletedAt: now }
        });
      }

      await tx.list.updateMany({
        where: { storeId, deleted: false },
        data: { deleted: true, deletedAt: now }
      });

      await tx.item.updateMany({
        where: { storeId, deleted: false },
        data: { deleted: true, deletedAt: now }
      });

      await tx.section.updateMany({
        where: { storeId, deleted: false },
        data: { deleted: true, deletedAt: now }
      });

      await tx.store.update({
        where: { id: storeId },
        data: { deleted: true, deletedAt: now }
      });
    });

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { householdId: true } });
    if (store) this.notifyHouseholdMembers(store.householdId);

    return { success: true };
  }

  private notifyHouseholdMembers(householdId: string) {
    this.prisma.household
      .findUnique({
        where: { id: householdId },
        select: { users: { select: { id: true } } },
      })
      .then((household) => {
        if (household) {
          this.sseBroadcast.notify(household.users.map((u) => u.id));
        }
      })
      .catch(() => {
        // Best-effort
      });
  }

  private async verifyHouseholdAccess(householdId: string, userId: string) {
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, deleted: false },
      select: {
        users: {
          where: { id: userId },
          select: { id: true },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    if (household.users.length === 0) {
      throw new ForbiddenException('Access denied');
    }
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
