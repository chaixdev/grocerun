import { PrismaService } from '../prisma.service';
import { Item } from '@prisma/client';
export declare class ItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    pull(minUpdatedAt: Date): Promise<{
        id: string;
        name: string;
        checked: boolean;
        updatedAt: Date;
        createdAt: Date;
    }[]>;
    push(items: Item[]): Promise<any[]>;
}
