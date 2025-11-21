"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const httpStatus_1 = require("../utils/httpStatus");
class BaseController {
    constructor(service, relations = []) {
        this.withRelations = [];
        this.getAll = async (req, res) => {
            try {
                const items = await this.service.findAll(this.withRelations);
                const status = httpStatus_1.HttpStatus.OK;
                return res.status(status).json({
                    success: true,
                    status,
                    message: "List retrieved successfully",
                    data: items,
                });
            }
            catch (err) {
                const status = httpStatus_1.HttpStatus.INTERNAL_SERVER_ERROR;
                return res.status(status).json({
                    success: false,
                    status,
                    message: "Server error during fetching list",
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        };
        this.getOne = async (req, res) => {
            try {
                const item = await this.service.findById(parseInt(req.params.id), this.withRelations);
                if (!item) {
                    const status = httpStatus_1.HttpStatus.NOT_FOUND;
                    return res.status(status).json({
                        success: false,
                        status,
                        message: "Item not found",
                    });
                }
                const status = httpStatus_1.HttpStatus.OK;
                return res.status(status).json({
                    success: true,
                    status,
                    message: "Item retrieved successfully",
                    data: item,
                });
            }
            catch (err) {
                const status = httpStatus_1.HttpStatus.INTERNAL_SERVER_ERROR;
                return res.status(status).json({
                    success: false,
                    status,
                    message: "Server error during fetching item",
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        };
        this.create = async (req, res) => {
            try {
                const newItem = await this.service.create(req.body);
                const status = httpStatus_1.HttpStatus.CREATED;
                return res.status(status).json({
                    success: true,
                    status,
                    message: "Item created successfully",
                    data: newItem,
                });
            }
            catch (err) {
                const status = httpStatus_1.HttpStatus.BAD_REQUEST;
                return res.status(status).json({
                    success: false,
                    status,
                    message: "Error during creation",
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        };
        this.update = async (req, res) => {
            try {
                const updated = await this.service.update(parseInt(req.params.id), req.body);
                if (!updated) {
                    const status = httpStatus_1.HttpStatus.NOT_FOUND;
                    return res.status(status).json({
                        success: false,
                        status,
                        message: "Item not found",
                    });
                }
                const status = httpStatus_1.HttpStatus.OK;
                return res.status(status).json({
                    success: true,
                    status,
                    message: "Item updated successfully",
                    data: updated,
                });
            }
            catch (err) {
                const status = httpStatus_1.HttpStatus.BAD_REQUEST;
                return res.status(status).json({
                    success: false,
                    status,
                    message: "Error during update",
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        };
        this.delete = async (req, res) => {
            try {
                const result = await this.service.delete(parseInt(req.params.id));
                if (result.affected === 0) {
                    const status = httpStatus_1.HttpStatus.NOT_FOUND;
                    return res.status(status).json({
                        success: false,
                        status,
                        message: "Item not found",
                    });
                }
                const status = httpStatus_1.HttpStatus.OK;
                return res.status(status).json({
                    success: true,
                    status,
                    message: "Item deleted successfully",
                });
            }
            catch (err) {
                const status = httpStatus_1.HttpStatus.INTERNAL_SERVER_ERROR;
                return res.status(status).json({
                    success: false,
                    status,
                    message: "Server error during deletion",
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        };
        this.service = service;
        this.withRelations = relations;
    }
}
exports.BaseController = BaseController;
