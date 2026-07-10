import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SseBroadcastService } from '../sync/sse-broadcast.service';

@Injectable()
export class SseSyncBroadcastService {
  private readonly logger = new Logger(SseSyncBroadcastService.name);

  constructor(
    private prisma: PrismaService,
    private sse: SseBroadcastService,
  ) {}

  /**
   * Notify all household members by looking up the store's household.
   * Fire-and-forget — failure must never block the mutation.
   */
  byStore(storeId: string, collections: string[], reason: string) {
    this.prisma.store
      .findUnique({
        where: { id: storeId },
        select: {
          household: {
            select: { users: { select: { id: true } } },
          },
        },
      })
      .then((store) => {
        if (store) {
          this.sse.notifyChanged(
            store.household.users.map((u) => u.id),
            { collections, reason },
          );
        }
      })
      .catch((error) => {
        this.logger.warn('Notification byStore failed', error instanceof Error ? error.message : String(error));
      });
  }

  /**
   * Notify all household members by household ID.
   * Fire-and-forget — failure must never block the mutation.
   */
  byHousehold(householdId: string, collections: string[], reason: string) {
    this.prisma.household
      .findUnique({
        where: { id: householdId },
        select: { users: { select: { id: true } } },
      })
      .then((household) => {
        if (household) {
          this.sse.notifyChanged(
            household.users.map((u) => u.id),
            { collections, reason },
          );
        }
      })
      .catch((error) => {
        this.logger.warn('Notification byHousehold failed', error instanceof Error ? error.message : String(error));
      });
  }
}
