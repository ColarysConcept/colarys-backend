"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrudRouter = createCrudRouter;
const express_1 = require("express");
const withVersionHeader_1 = require("../middleware/withVersionHeader");
function createCrudRouter(controller, entity, basePath = "", middlewares = []) {
    const router = (0, express_1.Router)();
    router.get(`${basePath}/getAll`, (0, withVersionHeader_1.withVersionHeader)(entity), ...middlewares, controller.getAll);
    router.get(`${basePath}/getOne/:id`, (0, withVersionHeader_1.withVersionHeader)(entity), ...middlewares, controller.getOne);
    router.post(`${basePath}/create`, ...middlewares, controller.create);
    router.put(`${basePath}/update/:id`, ...middlewares, controller.update);
    router.delete(`${basePath}/delete/:id`, ...middlewares, controller.delete);
    return router;
}
