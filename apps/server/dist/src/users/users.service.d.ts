import { PrismaService } from '../prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    pull(minUpdatedAt: Date): Promise<{
        id: string;
        email: string;
        name: string;
        householdIds: string[];
        updatedAt: Date;
        createdAt: Date;
    }[]>;
    push(users: Array<{
        id: string;
        email: string;
        name?: string;
        householdIds: string[];
    }>): Promise<any[]>;
}
