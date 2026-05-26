import { createClient, type RedisClientType } from "redis";
import { AppError } from "../utils/AppError.js";
import { getConfig } from "./vault.config.js";

let redisClient: RedisClientType | null = null;

export const getRedisClient = () => {
    if (!redisClient) {
        throw new AppError("Redis client has not been initialized", 500);
    }

    return redisClient;
};

export const connectRedis = async () => {
    if (redisClient?.isOpen) {
        return redisClient;
    }

    const config = await getConfig();

    if (!config.REDIS_URL) {
        throw new AppError("REDIS_URL is required to create a Redis client", 500);
    }

    redisClient = createClient({
        url: config.REDIS_URL,
    });

    redisClient.on("error", (err) => console.error("Redis Client Error", err));

    await redisClient.connect();
    console.log("Redis connected");

    return redisClient;
};

export const disconnectRedis = async () => {
    if (redisClient?.isOpen) {
        await redisClient.quit();
    }
};
