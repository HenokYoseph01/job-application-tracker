import {type Request, type Response} from 'express';
import { comparePassword, hashPassword } from '../utils/passHash.js';
import { prisma } from '../lib/prisma.js';
import { signJwt, signRefreshJwt } from '../utils/jwtsign.js';
import { redisClient } from '../lib/redis.js';
import { verifyRefreshJwt } from '../utils/jwtverify.js';

type RegisterUserBody = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type LoginUserBody = {
    email: string;
    password: string;
};

type ProfileQuery = {
    id?: string;
};

const userSelect = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const registerUser = async(
    req: Request<unknown, unknown, RegisterUserBody>,
    res: Response
) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        const normalizedEmail = normalizeEmail(email ?? "");
        const normalizedUsername = username?.trim();

        if(!normalizedUsername || !normalizedEmail || !password || !confirmPassword) {
            return res.status(400).json({
                status: 400,
                error: "Missing required fields"
            });
        }

        if(!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid email"
            });
        }

        if(password.length < 8) {
            return res.status(400).json({
                status: 400,
                error: "Password must be at least 8 characters"
            });
        }

        if(password !== confirmPassword) {
            return res.status(400).json({
                status: 400,
                error: "Passwords do not match"
            });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                name: normalizedUsername,
                email: normalizedEmail,
                passwordHash: hashedPassword
            },
            select: userSelect
        });

        res.status(201).json({
            status: 201,
            data: newUser
        });

        
    } catch (error: any) {
        console.error(error);

        if (error.code === "P2002") {
            return res.status(409).json({
                status: 409,
                error: "Email already exists"
            });
        }

        return res.status(500).json({
            status: 500,
            error: "Internal Server Error"
        });
    }
}

const loginUser = async(
    req: Request<unknown, unknown, LoginUserBody>,
    res: Response
) => {
    try {
            const { email, password } = req.body;
            const normalizedEmail = normalizeEmail(email ?? "");

            if(!normalizedEmail || !password) {
                return res.status(400).json({
                    status: 400,
                    error: "Missing required fields"
                });
            }

            const user = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            })

            if(!user) {
                return res.status(401).json({
                    status: 401,
                    error: "Invalid credentials"
                });
            }

            const isPasswordValid = await comparePassword(password, user.passwordHash);

            if(!isPasswordValid) {
                return res.status(401).json({
                    status: 401,
                    error: "Invalid credentials"
                });
            }

            //Create token
            const token = signJwt({ id: user.id, email: user.email });

            if(!token) {
                return res.status(500).json({
                    status: 500,
                    error: "Failed to generate token"
                });
            }

            const refreshToken = signRefreshJwt({
                id: user.id,
                email: user.email,
                type: 'refresh'
            });

            if(!refreshToken) {
                return res.status(500).json({
                    status: 500,
                    error: "Failed to generate refresh token"
                });
            }

            //Store in redis
            await redisClient.set(`refreshToken:${user.id}`, refreshToken);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',

            });

            const { passwordHash, ...safeUser } = user;

            res.status(200).json({
                status: 200,
                data: safeUser,
                token,
                // refreshToken
            });

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 500,
            error: "Internal Server Error"
        });
    }
}

const getUserProfile = async(
    req: Request,
    res: Response
) => {
    try {
        const id = req.user?.id as number;

        if(Number.isNaN(id)) {
            return res.status(400).json({
                status: 400,
                error: "User id is required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: userSelect
        });

        if(!user) {
            return res.status(404).json({
                status: 404,
                error: "User not found"
            });
        }

        res.status(200).json({
            status: 200,
            data: user
        });
    } catch (error) {
        console.error(error);
       
    }
}

const refresh = async(
    req: Request,
    res: Response
) => {
    try {
        const refreshToken = req.cookies.refreshToken; //old

        if(!refreshToken) {
            return res.status(401).json({
                status: 401,
                error: "Missing refresh token"
            });
        }

        const decoded = verifyRefreshJwt(refreshToken);

        if(!decoded || decoded.type !== 'refresh') {
            return res.status(401).json({
                status: 401,
                error: "Invalid refresh token"
            });
        }

        const storedToken = await redisClient.get(`refreshToken:${decoded.id}`);

        if(storedToken !== refreshToken) {
            await redisClient.del(`refreshToken:${decoded.id}`);
            return res.status(403).json({
                status: 403,
                error: "Refresh token revoked"
            });
        }

         const token = signJwt({ id: decoded.id, email: decoded.email });

            if(!token) {
                return res.status(500).json({
                    status: 500,
                    error: "Failed to generate token"
                });
            }


         const newRefreshToken = signRefreshJwt({
            id: decoded.id,
            email: decoded.email,
            type: 'refresh'
        });

            if(!newRefreshToken) {
                return res.status(500).json({
                    status: 500,
                    error: "Failed to generate refresh token"
                });
            }

            //Store in redis
            await redisClient.set(`refreshToken:${decoded.id}`, newRefreshToken);

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',

            });

            return res.status(200).json({
                status: 200,
                token
            });
    } catch (error) {
         return res.status(500).json({
            status: 500,
            error: "Internal Server Error"
        });
    }
}


export default{ registerUser, loginUser, getUserProfile, refresh }; 
