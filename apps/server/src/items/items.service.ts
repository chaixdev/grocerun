import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Item } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async pull(minUpdatedAt: Date) {
    return this.prisma.item.findMany({
      where: {
        updatedAt: {
          gt: minUpdatedAt,
        },
      },
    });
  }

  async push(items: Item[]) {
    const results = [];
    for (const item of items) {
      // Upsert logic
      const result = await this.prisma.item.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          checked: item.checked,
          updatedAt: new Date(), // Force update timestamp
        },
        create: {
          id: item.id,
          name: item.name,
          checked: item.checked,
        },
      });
      results.push(result);
    }
    return results;
  }
}
