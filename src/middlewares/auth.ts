import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';


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
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string)as any;
        console.log(' Decoded Token:', decoded);
        req .user = {
            email: decoded.email as string,
            id: decoded.id as number
        };
     next();
    } catch (error) {
        return res.status(401).json({error: 'Unauthorized, invalid token'});
    }


    
}