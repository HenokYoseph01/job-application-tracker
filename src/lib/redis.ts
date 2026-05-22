import { createClient } from "redis";
import "dotenv/config";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error("REDIS_URL is required to create a Redis client");
}

export const redisClient = createClient({
    url: redisUrl,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Redis connected");
    }
};

export const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
};
