"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsColarysManualCreation1712345678906 = void 0;
class AgentsColarysManualCreation1712345678906 {
    constructor() {
        this.name = 'AgentsColarysManualCreation1712345678906';
    }
    async up(queryRunner) {
        console.log('✅ Table agents_colarys créée manuellement dans Supabase');
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS agents_colarys`);
    }
}
exports.AgentsColarysManualCreation1712345678906 = AgentsColarysManualCreation1712345678906;
