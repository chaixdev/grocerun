"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let HouseholdsService = class HouseholdsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async pull(minUpdatedAt) {
        return this.prisma.household.findMany({
            where: {
                updatedAt: {
                    gt: minUpdatedAt,
                },
            },
        });
    }
    async push(households) {
        const results = [];
        for (const household of households) {
            const result = await this.prisma.household.upsert({
                where: { id: household.id },
                update: {
                    name: household.name,
                    ownerId: household.ownerId,
                    updatedAt: new Date(),
                },
                create: {
                    id: household.id,
                    name: household.name,
                    ownerId: household.ownerId,
                },
            });
            results.push(result);
        }
        return results;
    }
};
exports.HouseholdsService = HouseholdsService;
exports.HouseholdsService = HouseholdsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HouseholdsService);
//# sourceMappingURL=households.service.js.map