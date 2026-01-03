import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Household } from '@prisma/client';

@Injectable()
export class HouseholdsService {
  constructor(private prisma: PrismaService) {}

  async pull(minUpdatedAt: Date) {
    return this.prisma.household.findMany({
      where: {
        updatedAt: {
          gt: minUpdatedAt,
        },
      },
    });
  }

  async push(households: Household[]) {
    const results = [];
    for (const household of households) {
      // Upsert logic
      const result = await this.prisma.household.upsert({
        where: { id: household.id },
        update: {
          name: household.name,
          ownerId: household.ownerId,
          updatedAt: new Date(),
        },
        create: {
          id: household.id,
          name: household.name,
          ownerId: household.ownerId,
        },
      });
      results.push(result);
    }
    return results;
  }
}
