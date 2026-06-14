import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HouseholdOverviewService {
  constructor(private prisma: PrismaService) {}

  async getHouseholdOverview(userId: string) {
    // Fetch households where the user is a member
    // Include stores and their ACTIVE lists (status != 'COMPLETED')
    const households = await this.prisma.household.findMany({
      where: {
        deleted: false,
        users: {
          some: {
            id: userId
          }
        }
      },
      include: {
        stores: {
          where: { deleted: false },
          include: {
            lists: {
              where: {
                deleted: false,
                status: { not: 'COMPLETED' }
              },
              orderBy: { updatedAt: 'desc' },
              include: {
                _count: {
                  select: { items: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return households;
  }
}
