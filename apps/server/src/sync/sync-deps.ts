import { PrismaService } from '../prisma.service';

export type SyncDeps = {
  prisma: PrismaService;
  getAccessibleStoreIds(userId: string): Promise<string[]>;
  getAccessibleHouseholdIds(userId: string): Promise<string[]>;
  verifyStoreAccess(storeId: string, userId: string): Promise<void>;
  verifyHouseholdAccess(householdId: string, userId: string): Promise<void>;
};
