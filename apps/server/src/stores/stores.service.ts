import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessService } from '../shared/access.service';
import { NotificationService } from '../shared/notification.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { cascadeSoftDeleteStore } from '../shared/cascade-soft-delete';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private notify: NotificationService,
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
    await this.access.verifyStoreAccess(storeId, userId);

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
    await this.access.verifyHouseholdAccess(dto.householdId, userId);

    const store = await this.prisma.store.create({
      data: {
        name: dto.name,
        location: dto.location,
        householdId: dto.householdId,
      },
    });

    this.notify.byHousehold(dto.householdId, ['store', 'section'], 'store-mutation');

    return store;
  }

  async updateStore(storeId: string, dto: UpdateStoreDto, userId: string) {
    await this.access.verifyStoreAccess(storeId, userId);

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        name: dto.name,
        location: dto.location,
        imageUrl: dto.imageUrl,
      }
    });

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { householdId: true } });
    if (store) this.notify.byHousehold(store.householdId, ['store', 'section'], 'store-mutation');

    return { success: true };
  }

  async deleteStore(storeId: string, userId: string) {
    await this.access.verifyStoreAccess(storeId, userId);

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await cascadeSoftDeleteStore(tx, storeId, now);
    });

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { householdId: true } });
    if (store) this.notify.byHousehold(store.householdId, ['store', 'section'], 'store-mutation');

    return { success: true };
  }

}
