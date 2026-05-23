import jwt from "jsonwebtoken";
import 'dotenv/config';

interface JwtPayload {
    id: number;
    email: string;
}

interface JwtRefreshPayload extends JwtPayload {
    type: "refresh";
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}

export function signRefreshJwt(payload: JwtRefreshPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string);
}
