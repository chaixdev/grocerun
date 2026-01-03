import { PrismaService } from '../prisma.service';
import { Household } from '@prisma/client';
export declare class HouseholdsService {
    private prisma;
    constructor(prisma: PrismaService);
    pull(minUpdatedAt: Date): Promise<{
        id: string;
        name: string;
        updatedAt: Date;
        createdAt: Date;
        ownerId: string | null;
    }[]>;
    push(households: Household[]): Promise<any[]>;
}
