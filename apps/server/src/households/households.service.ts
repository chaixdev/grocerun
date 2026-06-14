import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { CreateHouseholdDto, UpdateHouseholdDto } from './dto/household.dto';

@Injectable()
export class HouseholdsService {
  constructor(
    private prisma: PrismaService,
    private sseBroadcast: SseBroadcastService,
  ) {}

  async getHouseholds(userId: string) {
    const households = await this.prisma.household.findMany({
      where: {
        deleted: false,
        users: { some: { id: userId } }
      },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } } }
    });

    return households;
  }

  async createHousehold(dto: CreateHouseholdDto, userId: string) {
    const household = await this.prisma.household.create({
      data: {
        name: dto.name,
        ownerId: userId,
        users: { connect: { id: userId } },
      },
    });

    this.notifyHouseholdMembers(household.id);

    return { success: true };
  }

  async renameHousehold(householdId: string, dto: UpdateHouseholdDto, userId: string) {
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, deleted: false },
      select: { ownerId: true }
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    // Only owner can rename
    if (household.ownerId && household.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can rename the household');
    }

    await this.prisma.household.update({
      where: { id: householdId },
      data: {
        name: dto.name,
        // If it was a legacy household (no owner), claim ownership
        ...(household.ownerId === null ? { ownerId: userId } : {})
      }
    });

    this.notifyHouseholdMembers(householdId);

    return { success: true };
  }

  async leaveHousehold(householdId: string, userId: string) {
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, deleted: false },
      select: { ownerId: true }
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    if (household.ownerId === userId) {
      throw new BadRequestException('Owners cannot leave their own household. Delete it instead.');
    }

    await this.prisma.household.update({
      where: { id: householdId },
      data: {
        updatedAt: new Date(),
        users: { disconnect: { id: userId } }
      }
    });

    this.sseBroadcast.notifyHouseholdRemoved([userId], householdId);

    this.notifyHouseholdMembers(householdId);

    return { success: true };
  }

  async deleteHousehold(householdId: string, userId: string) {
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, deleted: false },
      include: { _count: { select: { users: true } } }
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    // Verify ownership - allow if ownerId matches OR if it's a legacy household (null ownerId)
    if (household.ownerId && household.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete the household');
    }

    // Verify member count
    if (household._count.users > 1) {
      throw new BadRequestException('Cannot delete household with other members. Remove them first.');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Cascade soft-delete: ListItems → Lists → Items → Sections → Stores → Household
      const stores = await tx.store.findMany({
        where: { householdId, deleted: false },
        select: { id: true }
      });
      const storeIds = stores.map(s => s.id);

      if (storeIds.length > 0) {
        const lists = await tx.list.findMany({
          where: { storeId: { in: storeIds }, deleted: false },
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
          where: { storeId: { in: storeIds }, deleted: false },
          data: { deleted: true, deletedAt: now }
        });

        await tx.item.updateMany({
          where: { storeId: { in: storeIds }, deleted: false },
          data: { deleted: true, deletedAt: now }
        });

        await tx.section.updateMany({
          where: { storeId: { in: storeIds }, deleted: false },
          data: { deleted: true, deletedAt: now }
        });

        await tx.store.updateMany({
          where: { id: { in: storeIds } },
          data: { deleted: true, deletedAt: now }
        });
      }

      await tx.household.update({
        where: { id: householdId },
        data: { deleted: true, deletedAt: now }
      });
    });

    this.sseBroadcast.notifyHouseholdRemoved([userId], householdId);

    this.notifyHouseholdMembers(householdId);

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
}
