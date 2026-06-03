import { type Response } from "express";

type SuccessOptions = {
    message: string;
    data?: unknown;
    meta?: Record<string, unknown>;
    statusCode?: number;
};

type ErrorOptions = {
    message: string;
    errors?: unknown;
    statusCode?: number;
};

export const sendSuccess = (
    res: Response,
    { message, data, meta, statusCode = 200 }: SuccessOptions
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        meta,
    });
};

export const sendError = (
    res: Response,
    { message, errors, statusCode = 500 }: ErrorOptions
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
