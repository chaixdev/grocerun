import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CreateHouseholdDto = {
  name: string;
}

type RenameHouseholdDto = {
  name: string;
}

@Injectable()
export class HouseholdsService {
  constructor(private prisma: PrismaService) {}

  async getHouseholds(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        households: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { users: true } } }
        }
      },
    });

    return user?.households || [];
  }

  async createHousehold(dto: CreateHouseholdDto, userId: string) {
    await this.prisma.household.create({
      data: {
        name: dto.name,
        ownerId: userId,
        users: { connect: { id: userId } },
      },
    });

    return { success: true };
  }

  async renameHousehold(householdId: string, dto: RenameHouseholdDto, userId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
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

    return { success: true };
  }

  async leaveHousehold(householdId: string, userId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
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
        users: { disconnect: { id: userId } }
      }
    });

    return { success: true };
  }

  async deleteHousehold(householdId: string, userId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
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

    await this.prisma.household.delete({ where: { id: householdId } });

    return { success: true };
  }
}
