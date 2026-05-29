import {type Request, type Response, type NextFunction} from 'express';
import { getConfig } from '../lib/vault.config.js';
import { AppError } from '../utils/AppError.js';

const getPrismaError = (err: any) => {
    if (err?.code === "P2002") {
        return new AppError("Resource already exists", 409);
    }

    if (err?.code === "P2025") {
        return new AppError("Resource not found", 404);
    }

    return err;
};

export const geh = async(err: any, req: Request, res: Response, next: NextFunction) => {
    const config = await getConfig().catch(() => ({ NODE_ENV: process.env.NODE_ENV ?? "development" }));
    const normalizedError = getPrismaError(err);
    const statusCode = normalizedError.statusCode || 500;
    const status = normalizedError.status || (statusCode >= 500 ? "error" : "fail");
    const message = normalizedError.isOperational ? normalizedError.message : "Internal Server Error";

    res.status(statusCode).json({
        status,
        message,
        stack: config.NODE_ENV === 'development' ? normalizedError.stack : undefined
    })
}
