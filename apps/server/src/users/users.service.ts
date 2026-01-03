import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async pull(minUpdatedAt: Date) {
    const users = await this.prisma.user.findMany({
      where: {
        updatedAt: {
          gt: minUpdatedAt,
        },
      },
      include: {
        households: true,
      },
    });

    // Transform to include householdIds array for RxDB
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      householdIds: user.households.map(h => h.id),
      updatedAt: user.updatedAt,
      createdAt: user.createdAt,
    }));
  }

  async push(users: Array<{ id: string; email: string; name?: string; householdIds: string[] }>) {
    const results = [];
    for (const userData of users) {
      // Upsert user
      const user = await this.prisma.user.upsert({
        where: { id: userData.id },
        update: {
          email: userData.email,
          name: userData.name,
          updatedAt: new Date(),
        },
        create: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
        },
      });

      // Sync household relationships
      // First, disconnect all existing households
      await this.prisma.user.update({
        where: { id: userData.id },
        data: {
          households: {
            set: [],
          },
        },
      });

      // Then connect the new ones
      if (userData.householdIds && userData.householdIds.length > 0) {
        await this.prisma.user.update({
          where: { id: userData.id },
          data: {
            households: {
              connect: userData.householdIds.map(id => ({ id })),
            },
          },
        });
      }

      results.push(user);
    }
    return results;
  }
}
