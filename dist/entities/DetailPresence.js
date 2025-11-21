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
exports.DetailPresence = void 0;
// backend/src/entities/DetailPresence.ts
const typeorm_1 = require("typeorm");
const Presence_1 = require("./Presence");
let DetailPresence = class DetailPresence {
};
exports.DetailPresence = DetailPresence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DetailPresence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "signature_entree", type: "text" }),
    __metadata("design:type", String)
], DetailPresence.prototype, "signatureEntree", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "signature_sortie", type: "text", nullable: true }),
    __metadata("design:type", String)
], DetailPresence.prototype, "signatureSortie", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], DetailPresence.prototype, "observations", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Presence_1.Presence, presence => presence.details),
    (0, typeorm_1.JoinColumn)({ name: "presence_id" }),
    __metadata("design:type", Presence_1.Presence)
], DetailPresence.prototype, "presence", void 0);
exports.DetailPresence = DetailPresence = __decorate([
    (0, typeorm_1.Entity)("detail_presence")
], DetailPresence);
