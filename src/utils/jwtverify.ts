import jwt from "jsonwebtoken";
import "dotenv/config";
import { AppError } from "./AppError.js";

export interface JwtPayload {
    id: number;
    email: string;
}

export interface JwtRefreshPayload {
    id: number;
    email: string;
    type: string;
}

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError("JWT_SECRET is required", 500);
    }

    return secret;
};

export function verifyJwt(token: string): JwtPayload {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export function verifyRefreshJwt(token: string): JwtRefreshPayload {
    return jwt.verify(token, getJwtSecret()) as JwtRefreshPayload;
}

export { jwt };
