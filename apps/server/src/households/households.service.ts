import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { SseSyncBroadcastService } from '../shared/sse-sync-broadcast.service';
import { CreateHouseholdDto, UpdateHouseholdDto } from './dto/household.dto';
import { cascadeSoftDeleteHousehold } from '../shared/cascade-soft-delete';

@Injectable()
export class HouseholdsService {
  constructor(
    private prisma: PrismaService,
    private sseBroadcast: SseBroadcastService,
    private sseSyncBroadcast: SseSyncBroadcastService,
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

    this.sseSyncBroadcast.byHousehold(household.id, ['household', 'store'], 'household-mutation');

    return household;
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
    if (household.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can rename the household');
    }

    await this.prisma.household.update({
      where: { id: householdId, deleted: false },
      data: {
        name: dto.name
      }
    });

    this.sseSyncBroadcast.byHousehold(householdId, ['household', 'store'], 'household-mutation');

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
      where: { id: householdId, deleted: false },
      data: {
        updatedAt: new Date(),
        users: { disconnect: { id: userId } }
      }
    });

    this.sseBroadcast.notifyHouseholdRemoved([userId], householdId);

    this.sseSyncBroadcast.byHousehold(householdId, ['household', 'store'], 'household-mutation');

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

    // Verify ownership — only the owner can delete
    if (household.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete the household');
    }

    // Verify member count
    if (household._count.users > 1) {
      throw new BadRequestException('Cannot delete household with other members. Remove them first.');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await cascadeSoftDeleteHousehold(tx, householdId, now);
    });

    this.sseBroadcast.notifyHouseholdRemoved([userId], householdId);

    this.sseSyncBroadcast.byHousehold(householdId, ['household', 'store'], 'household-mutation');

    return { success: true };
  }

  async removeMember(householdId: string, memberUserId: string, requestingUserId: string) {
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, deleted: false },
      select: { ownerId: true }
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    // Only owner can remove members
    if (household.ownerId !== requestingUserId) {
      throw new ForbiddenException('Only the owner can remove members');
    }

    // Cannot remove yourself — use leave flow instead
    if (memberUserId === requestingUserId) {
      throw new BadRequestException('Cannot remove yourself. Use the leave flow instead.');
    }

    // Cannot remove the owner
    if (memberUserId === household.ownerId) {
      throw new BadRequestException('Cannot remove the owner. Transfer ownership first.');
    }

    await this.prisma.household.update({
      where: { id: householdId, deleted: false },
      data: {
        updatedAt: new Date(),
        users: { disconnect: { id: memberUserId } }
      }
    });

    // Notify the removed user so they can clean up their local state
    this.sseBroadcast.notifyHouseholdRemoved([memberUserId], householdId);

    this.sseSyncBroadcast.byHousehold(householdId, ['household', 'store'], 'household-mutation');

    return { success: true };
  }
}
