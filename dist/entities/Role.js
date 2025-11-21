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
exports.Role = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
const Agent_1 = require("./Agent");
let Role = class Role {
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: false,
        length: 150,
        unique: true
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 150),
    __metadata("design:type", String)
], Role.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamp',
        name: 'date_ajout'
    }),
    __metadata("design:type", Date)
], Role.prototype, "dateajout", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamp',
        name: 'updated_at'
    }),
    __metadata("design:type", Date)
], Role.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Agent_1.Agent, (agent) => agent.campagne),
    __metadata("design:type", Array)
], Role.prototype, "agents", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)()
], Role);
