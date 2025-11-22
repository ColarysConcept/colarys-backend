"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonAPIService = void 0;
const axios_1 = __importDefault(require("axios"));
const PYTHON_API_BASE = 'http://localhost:8000';
class PythonAPIService {
    static async getEmployes() {
        const response = await axios_1.default.get(`${PYTHON_API_BASE}/employes`);
        return response.data;
    }
    static async createEmploye(employe) {
        const response = await axios_1.default.post(`${PYTHON_API_BASE}/employes`, employe);
        return response.data;
    }
    static async updateEmploye(matricule, employe) {
        const response = await axios_1.default.put(`${PYTHON_API_BASE}/employes/${matricule}`, employe);
        return response.data;
    }
    static async deleteEmploye(matricule) {
        const response = await axios_1.default.delete(`${PYTHON_API_BASE}/employes/${matricule}`);
        return response.data;
    }
    static async getPresences(year, month) {
        const response = await axios_1.default.get(`${PYTHON_API_BASE}/presences/${year}/${month}`);
        return response.data;
    }
    static async updatePresences(year, month, presences) {
        const response = await axios_1.default.post(`${PYTHON_API_BASE}/presences/${year}/${month}`, presences);
        return response.data;
    }
    static async getSalaires(year, month) {
        const response = await axios_1.default.get(`${PYTHON_API_BASE}/salaires/${year}/${month}`);
        return response.data;
    }
    static async updateSalaires(year, month, salaires) {
        const response = await axios_1.default.post(`${PYTHON_API_BASE}/salaires/${year}/${month}`, salaires);
        return response.data;
    }
}
exports.PythonAPIService = PythonAPIService;
