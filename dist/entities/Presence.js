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
exports.Presence = void 0;
// backend/src/entities/Presence.ts
const typeorm_1 = require("typeorm");
const Agent_1 = require("./Agent");
const DetailPresence_1 = require("./DetailPresence");
let Presence = class Presence {
};
exports.Presence = Presence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Presence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Agent_1.Agent, agent => agent.presences),
    (0, typeorm_1.JoinColumn)({ name: "agent_id" }),
    __metadata("design:type", Agent_1.Agent)
], Presence.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", default: () => "CURRENT_DATE" }),
    __metadata("design:type", String)
], Presence.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "heure_entree", type: "time" }),
    __metadata("design:type", String)
], Presence.prototype, "heureEntree", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "heure_sortie", type: "time", nullable: true }),
    __metadata("design:type", Object)
], Presence.prototype, "heureSortie", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "JOUR" }),
    __metadata("design:type", String)
], Presence.prototype, "shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "heures_travaillees", type: "decimal", precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Presence.prototype, "heuresTravaillees", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => DetailPresence_1.DetailPresence, detail => detail.presence),
    __metadata("design:type", DetailPresence_1.DetailPresence)
], Presence.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_at", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], Presence.prototype, "createdAt", void 0);
exports.Presence = Presence = __decorate([
    (0, typeorm_1.Entity)("presence")
], Presence);
