import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';
import { NotificationService } from '../shared/notification.service';
import { CreateHouseholdDto, UpdateHouseholdDto } from './dto/household.dto';
import { cascadeSoftDeleteHousehold } from '../shared/cascade-soft-delete';

@Injectable()
export class HouseholdsService {
  constructor(
    private prisma: PrismaService,
    private sseBroadcast: SseBroadcastService,
    private notify: NotificationService,
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

    this.notify.byHousehold(household.id, ['household', 'store'], 'household-mutation');

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
      where: { id: householdId },
      data: {
        name: dto.name
      }
    });

    this.notify.byHousehold(householdId, ['household', 'store'], 'household-mutation');

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

    this.notify.byHousehold(householdId, ['household', 'store'], 'household-mutation');

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

    this.notify.byHousehold(householdId, ['household', 'store'], 'household-mutation');

    return { success: true };
  }
}
