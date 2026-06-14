import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CreateStoreDto = {
  name: string;
  location?: string;
  householdId: string;
}

type UpdateStoreDto = {
  name: string;
  location?: string;
  imageUrl?: string;
}

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async getStores(householdId: string | undefined, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { households: true },
    });

    if (!user || user.households.length === 0) return [];

    let targetHouseholdId = householdId;

    // If no specific household requested, or requested one not found in user's list
    if (!targetHouseholdId || !user.households.find((h) => h.id === targetHouseholdId)) {
      targetHouseholdId = user.households[0]?.id;
    }

    const stores = await this.prisma.store.findMany({
      where: { householdId: targetHouseholdId },
      orderBy: { createdAt: 'desc' },
    });

    return stores;
  }

  async getStore(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    return this.prisma.store.findUnique({
      where: { id: storeId },
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

    await this.prisma.store.create({
      data: {
        name: dto.name,
        location: dto.location,
        householdId: dto.householdId,
      },
    });

    return { success: true };
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

    return { success: true };
  }

  async deleteStore(storeId: string, userId: string) {
    await this.verifyStoreAccess(storeId, userId);

    await this.prisma.store.delete({ where: { id: storeId } });

    return { success: true };
  }

  private async verifyHouseholdAccess(householdId: string, userId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
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
