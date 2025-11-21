"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = void 0;
class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends Error {
    constructor(message = 'Validation failed') {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
    }
}
exports.UnauthorizedError = UnauthorizedError;
const errorMiddleware = (error, _req, res, _next) => {
    console.error('Error:', error);
    // Défaut à 500 si le statusCode n'est pas défini
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    });
};
exports.errorMiddleware = errorMiddleware;
// // backend/src/middleware/errorMiddleware.ts
// import { Request, Response, NextFunction } from "express";
// export class AppError extends Error {
//   constructor(public message: string, public statusCode: number = 400) {
//     super(message);
//     this.name = "AppError";
//   }
// }
// export function errorMiddleware(
//   error: unknown,
//   _req: Request,
//   res: Response,
//   next: NextFunction
// ): void {
//   if (error instanceof AppError) {
//     res.status(error.statusCode).json({ error: error.message });
//   } else if (error instanceof Error) {
//     res.status(500).json({ error: error.message });
//   } else {
//     res.status(500).json({ error: "Erreur serveur inconnue" });
//   }
// }
