"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdsModule = void 0;
const common_1 = require("@nestjs/common");
const households_controller_1 = require("./households.controller");
const households_service_1 = require("./households.service");
const prisma_service_1 = require("../prisma.service");
let HouseholdsModule = class HouseholdsModule {
};
exports.HouseholdsModule = HouseholdsModule;
exports.HouseholdsModule = HouseholdsModule = __decorate([
    (0, common_1.Module)({
        controllers: [households_controller_1.HouseholdsController],
        providers: [households_service_1.HouseholdsService, prisma_service_1.PrismaService],
    })
], HouseholdsModule);
//# sourceMappingURL=households.module.js.map