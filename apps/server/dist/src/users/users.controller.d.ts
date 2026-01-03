import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    pull(minUpdatedAt?: string): Promise<{
        documents: {
            id: string;
            email: string;
            name: string;
            householdIds: string[];
            updatedAt: Date;
            createdAt: Date;
        }[];
        checkpoint: {
            updatedAt: string;
        };
    }>;
    push(body: {
        users: Array<{
            id: string;
            email: string;
            name?: string;
            householdIds: string[];
        }>;
    }): Promise<{
        success: boolean;
    }>;
}
