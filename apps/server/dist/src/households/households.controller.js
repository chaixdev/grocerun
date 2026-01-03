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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdsController = void 0;
const common_1 = require("@nestjs/common");
const households_service_1 = require("./households.service");
let HouseholdsController = class HouseholdsController {
    constructor(householdsService) {
        this.householdsService = householdsService;
    }
    async pull(minUpdatedAt) {
        const date = minUpdatedAt ? new Date(minUpdatedAt) : new Date(0);
        const documents = await this.householdsService.pull(date);
        return {
            documents,
            checkpoint: {
                updatedAt: documents.length > 0 ? documents[documents.length - 1].updatedAt.toISOString() : date.toISOString(),
            }
        };
    }
    async push(body) {
        await this.householdsService.push(body.households);
        return { success: true };
    }
};
exports.HouseholdsController = HouseholdsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('minUpdatedAt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "pull", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HouseholdsController.prototype, "push", null);
exports.HouseholdsController = HouseholdsController = __decorate([
    (0, common_1.Controller)('households'),
    __metadata("design:paramtypes", [households_service_1.HouseholdsService])
], HouseholdsController);
//# sourceMappingURL=households.controller.js.map