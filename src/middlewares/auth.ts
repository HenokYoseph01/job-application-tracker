import { type Request, type Response, type NextFunction } from 'express';
import 'dotenv/config';
import { jwt, verifyJwt } from '../utils/jwtverify.js';


export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({error: 'Unauthorized, missing or invalid token'});
    }

    // Get token from Header and split it from Bearer
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({error: 'Unauthorized, missing or invalid token'});
    }

    // Verify Token
    try {
        const decoded = verifyJwt(token);
        console.log(' Decoded Token:', decoded);
        req.user = {
            email: decoded.email,
            id: decoded.id
        };
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({error: 'Unauthorized, token expired'});
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({error: 'Unauthorized, invalid token'});
        }

        return res.status(400).json({error: 'Auth Failed'});
    }
    
}
