import jwt from "jsonwebtoken";
import 'dotenv/config';

interface JwtPayload {
    id: number;
    email: string;
}

interface JwtRefreshPayload {
    id: number;
    type: string;
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}

export function signRefreshJwt(payload: JwtRefreshPayload): string {
    return jwt.sign({ id: payload.id, type: payload.type }, process.env.JWT_SECRET as string);
}