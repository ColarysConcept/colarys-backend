"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentById = exports.getAllAgents = void 0;
const data_source_1 = require("../config/data-source");
const AgentColarys_1 = require("../entities/AgentColarys");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const agentRepository = data_source_1.AppDataSource.getRepository(AgentColarys_1.AgentColarys);
const getAllAgents = async (_req, res, next) => {
    try {
        console.log("🔄 Controller: Getting all agents");
        const agents = await agentRepository.find({
            order: { nom: "ASC", prenom: "ASC" }
        });
        res.json({
            success: true,
            data: agents,
            count: agents.length
        });
    }
    catch (error) {
        console.error("❌ Controller Error:", error);
        next(error);
    }
};
exports.getAllAgents = getAllAgents;
const getAgentById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw new errorMiddleware_1.ValidationError("ID invalide");
        }
        console.log(`🔄 Controller: Getting agent with ID: ${id}`);
        const agent = await agentRepository.findOne({ where: { id } });
        if (!agent) {
            throw new errorMiddleware_1.NotFoundError("Agent non trouvé");
        }
        res.json({
            success: true,
            data: agent
        });
    }
    catch (error) {
        console.error("❌ Controller Error:", error);
        next(error);
    }
};
exports.getAgentById = getAgentById;
// ... autres fonctions createAgent, updateAgent, deleteAgent
