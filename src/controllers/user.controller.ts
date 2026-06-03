import {type Request, type Response} from 'express';
import { comparePassword, hashPassword } from '../utils/passHash.js';
import { prisma } from '../lib/prisma.js';
import { signJwt, signRefreshJwt } from '../utils/jwtsign.js';
import { getRedisClient } from '../lib/redis.js';
import { verifyRefreshJwt } from '../utils/jwtverify.js';
import { redisKeys } from '../utils/redisKeys.js';
import { sendError, sendSuccess } from '../utils/response.js';

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

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_ATTEMPT_WINDOW_SECONDS = 5 * 60


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
            return sendError(res, { statusCode: 400, message: "Missing required fields" });
        }

        if(!isValidEmail(normalizedEmail)) {
            return sendError(res, { statusCode: 400, message: "Invalid email" });
        }

        if(password.length < 8) {
            return sendError(res, { statusCode: 400, message: "Password must be at least 8 characters" });
        }

        if(password !== confirmPassword) {
            return sendError(res, { statusCode: 400, message: "Passwords do not match" });
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

        return sendSuccess(res, {
            statusCode: 201,
            message: "User registered successfully",
            data: newUser
        });

        
    } catch (error: any) {
        console.error(error);

        if (error.code === "P2002") {
            return sendError(res, { statusCode: 409, message: "Email already exists" });
        }

        return sendError(res, { statusCode: 500, message: "Internal Server Error" });
    }
}

const loginUser = async(
    req: Request<unknown, unknown, LoginUserBody>,
    res: Response
) => {
    try {
            const { email, password } = req.body;
            const normalizedEmail = normalizeEmail(email ?? "");
            const redisClient = getRedisClient();

            if(!normalizedEmail || !password) {
                return sendError(res, { statusCode: 400, message: "Missing required fields" });
            }

            const redisKey = redisKeys.loginAttempts(normalizedEmail);
            //Check how many failed attempts in the last 5 minutes
            const attempts = await redisClient.get(redisKey);
            if (attempts && parseInt(attempts) >= MAX_LOGIN_ATTEMPTS) {
                return sendError(res, { statusCode: 429, message: "Too many login attempts. Please try again later." });
            }



            const user = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            })

            if(!user) {
                   //Increment failed login attempts
              const attempt =  await redisClient.incr(redisKey);
                if(attempt === 1) {
                    await redisClient.expire(redisKey, LOGIN_ATTEMPT_WINDOW_SECONDS);
                }
                return sendError(res, { statusCode: 401, message: "Invalid credentials" });
            }

            const isPasswordValid = await comparePassword(password, user.passwordHash);

            if(!isPasswordValid) {
                //Increment failed login attempts
              const attempt =  await redisClient.incr(redisKey);
                if(attempt === 1) {
                    await redisClient.expire(redisKey, LOGIN_ATTEMPT_WINDOW_SECONDS);
                }
                return sendError(res, { statusCode: 401, message: "Invalid credentials" });
            }

            await redisClient.del(redisKey); //Reset failed login attempts on successful login

            //Create token
            const token = signJwt({ id: user.id, email: user.email });

            if(!token) {
                return sendError(res, { statusCode: 500, message: "Failed to generate token" });
            }

            const refreshToken = signRefreshJwt({
                id: user.id,
                email: user.email,
                type: 'refresh'
            });

            if(!refreshToken) {
                return sendError(res, { statusCode: 500, message: "Failed to generate refresh token" });
            }

            //Store in redis
            await redisClient.set(redisKeys.refreshToken(user.id), refreshToken);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',

            });

            const { passwordHash, ...safeUser } = user;
            

            return sendSuccess(res, {
                message: "User logged in successfully",
                data: {
                    user: safeUser,
                    token,
                },
            });

        
    } catch (error) {
        console.error(error);
        return sendError(res, { statusCode: 500, message: "Internal Server Error" });
    }
}

const getUserProfile = async(
    req: Request,
    res: Response
) => {
    try {
        const id = req.user?.id as number;

        if(Number.isNaN(id)) {
            return sendError(res, { statusCode: 400, message: "User id is required" });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: userSelect
        });

        if(!user) {
            return sendError(res, { statusCode: 404, message: "User not found" });
        }

        return sendSuccess(res, {
            message: "User profile fetched successfully",
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
        const redisClient = getRedisClient();

        if(!refreshToken) {
            return sendError(res, { statusCode: 401, message: "Missing refresh token" });
        }

        const decoded = verifyRefreshJwt(refreshToken);

        if(!decoded || decoded.type !== 'refresh') {
            return sendError(res, { statusCode: 401, message: "Invalid refresh token" });
        }

        const storedToken = await redisClient.get(redisKeys.refreshToken(decoded.id));

        if(storedToken !== refreshToken) {
            await redisClient.del(redisKeys.refreshToken(decoded.id));
            return sendError(res, { statusCode: 403, message: "Refresh token revoked" });
        }

         const token = signJwt({ id: decoded.id, email: decoded.email });

            if(!token) {
                return sendError(res, { statusCode: 500, message: "Failed to generate token" });
            }


         const newRefreshToken = signRefreshJwt({
            id: decoded.id,
            email: decoded.email,
            type: 'refresh'
        });

            if(!newRefreshToken) {
                return sendError(res, { statusCode: 500, message: "Failed to generate refresh token" });
            }

            //Store in redis
            await redisClient.set(redisKeys.refreshToken(decoded.id), newRefreshToken);

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',

            });

            return sendSuccess(res, {
                message: "Token refreshed successfully",
                data: {
                    token
                }
            });
    } catch (error) {
         return sendError(res, { statusCode: 500, message: "Internal Server Error" });
    }
}


export default{ registerUser, loginUser, getUserProfile, refresh }; 
