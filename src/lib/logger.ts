import pino, { type Logger, type LoggerOptions } from "pino";
import { pinoHttp, type HttpLogger } from "pino-http";
import { type RequestHandler } from "express";
import { getConfig } from "./vault.config.js";
import { AppError } from "../utils/AppError.js";

let logger: Logger | null = null;

export const initLogger = async () => {
    if (logger) {
        return logger;
    }

    const config = await getConfig();
    const isProduction = config.NODE_ENV === "production";

    const loggerOptions: LoggerOptions = {
        level: isProduction ? "info" : "debug",
        redact: {
            paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "res.headers.set-cookie",
                "password",
                "passwordHash",
                "token",
                "refreshToken",
            ],
            censor: "[REDACTED]",
        },
        base: {
            service: "practice-backend",
            env: config.NODE_ENV,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    };

    logger = isProduction
        ? pino(loggerOptions)
        : pino({
            ...loggerOptions,
            transport: {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                },
            },
        });

    return logger;
};

export const getLogger = () => {
    if (!logger) {
        throw new AppError("Logger has not been initialized", 500);
    }

    return logger;
};

export const createHttpLogger = (): RequestHandler => {
    let httpLogger: HttpLogger<any, any> | null = null;

    return (req, res, next) => {
        const activeHttpLogger = httpLogger ??= pinoHttp<any, any>({
            logger: getLogger(),
            customLogLevel: (_req: any, res: any, error?: Error) => {
                if (error || res.statusCode >= 500) return "error";
                if (res.statusCode >= 400) return "warn";
                return "info";
            },
            customSuccessMessage: (req: any, res: any) => {
                return `${req.method} ${req.url} completed with ${res.statusCode}`;
            },
            customErrorMessage: (req: any, res: any, error: Error) => {
                return `${req.method} ${req.url} failed with ${res.statusCode}: ${error.message}`;
            },
        });

        return activeHttpLogger(req, res, next);
    };
};
