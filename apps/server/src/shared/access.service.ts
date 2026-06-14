import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { checkShoppingLock } from './shopping-lock';

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify that a store exists (not deleted) and the user is a member
   * of its household. Throws NotFoundException or ForbiddenException.
   */
  async verifyStoreAccess(storeId: string, userId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deleted: false },
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

  /**
   * Verify that a household exists (not deleted) and the user is a member.
   * Throws NotFoundException or ForbiddenException.
   */
  async verifyHouseholdAccess(householdId: string, userId: string): Promise<void> {
    const household = await this.prisma.household.findFirst({
      where: { id: householdId, deleted: false },
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

  /**
   * Assert that a list mutation is allowed. If the list is SHOPPING,
   * only the lock holder can mutate it. COMPLETED lists are immutable.
   */
  assertShoppingLock(
    list: { status: string; assignedTo?: string | null },
    lockId: string,
    message?: string,
  ): void {
    const result = checkShoppingLock(list, lockId)
    if (result.allowed) return

    const { reason } = result as { allowed: false; reason: 'COMPLETED' | 'LOCKED_BY_OTHER' | 'MISSING_LOCK' }
    if (reason === 'COMPLETED') {
      throw new BadRequestException('List is completed')
    }
    if (reason === 'MISSING_LOCK') {
      throw new ConflictException('Shopping lock is missing. Refresh and try again.')
    }
    throw new ForbiddenException(message ?? 'This list is locked by another shopper')
  }
}
