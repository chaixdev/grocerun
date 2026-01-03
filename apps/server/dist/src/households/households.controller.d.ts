import { HouseholdsService } from './households.service';
import { Household } from '@prisma/client';
export declare class HouseholdsController {
    private readonly householdsService;
    constructor(householdsService: HouseholdsService);
    pull(minUpdatedAt?: string): Promise<{
        documents: {
            id: string;
            name: string;
            updatedAt: Date;
            createdAt: Date;
            ownerId: string | null;
        }[];
        checkpoint: {
            updatedAt: string;
        };
    }>;
    push(body: {
        households: Household[];
    }): Promise<{
        success: boolean;
    }>;
}
