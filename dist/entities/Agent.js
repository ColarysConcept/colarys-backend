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
exports.Agent = void 0;
const typeorm_1 = require("typeorm");
const Presence_1 = require("./Presence");
let Agent = class Agent {
};
exports.Agent = Agent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Agent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", unique: true, nullable: true }),
    __metadata("design:type", String)
], Agent.prototype, "matricule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], Agent.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], Agent.prototype, "prenom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", default: "Standard" }),
    __metadata("design:type", String)
], Agent.prototype, "campagne", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Agent.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "date_creation", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Agent.prototype, "dateCreation", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Presence_1.Presence, presence => presence.agent),
    __metadata("design:type", Array)
], Agent.prototype, "presences", void 0);
exports.Agent = Agent = __decorate([
    (0, typeorm_1.Entity)("agent")
], Agent);
