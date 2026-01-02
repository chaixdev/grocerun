import { ItemsService } from './items.service';
import { Item } from '@prisma/client';
export declare class ItemsController {
    private readonly itemsService;
    constructor(itemsService: ItemsService);
    pull(minUpdatedAt?: string): Promise<{
        documents: {
            id: string;
            name: string;
            checked: boolean;
            updatedAt: Date;
            createdAt: Date;
        }[];
        checkpoint: {
            updatedAt: string;
        };
    }>;
    push(body: {
        items: Item[];
    }): Promise<{
        success: boolean;
    }>;
}
