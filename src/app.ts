import express, {type Request, type Response, type Application, type NextFunction} from "express";
import { AppError } from "./utils/AppError.js";
import { geh } from "./middlewares/geh.js";
import { prisma } from "./lib/prisma.js";
import "dotenv/config";
import { connectRedis, disconnectRedis, getRedisClient } from "./lib/redis.js";
import cookieParser from "cookie-parser";
import { createHttpLogger, getLogger, initLogger } from "./lib/logger.js";
import { sendSuccess } from "./utils/response.js";

//routes
import applicationRoutes from './routes/application.route.js'
import userRoutes from './routes/user.route.js'

const app: Application = express();
const PORT = 20000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use(createHttpLogger());


app.get("/health", (req: Request, res: Response) => {
    return sendSuccess(res, {
        message: "API is healthy",
        data: {
            status: "ok"
        }
    });
})

app.get("/health/redis", async (req: Request, res: Response) => {
    const redisClient = getRedisClient();

    await redisClient.set("health:redis", "ok", {
        EX: 30
    });

    const redisStatus = await redisClient.get("health:redis");

    return sendSuccess(res, {
        message: "Redis is healthy",
        data: {
            status: "ok",
            redis: redisStatus
        }
    });
})

app.get("/api/v1", (req: Request, res: Response) => {
    return sendSuccess(res, {
        message: "AOI version active"
    });
})

app.use("/api/v1/applications", applicationRoutes);

app.use("/api/v1/users", userRoutes);



// Handle 404 errors for undefined routes
app.use((req: Request, res:Response, next:NextFunction) => {
    const error = new AppError(`Can't find ${req.originalUrl}!`, 404);
    next(error);
})

app.use(geh);

const startServer = async () => {
    try {
        const logger = await initLogger();
        await connectRedis();

        const server = app.listen(PORT, () => {
            logger.info({ port: PORT }, "Server started");
        })

        //Graceful shutdown
        process.on("SIGINT", async() => {
            const logger = getLogger();
            await prisma.$disconnect();
            await disconnectRedis();
            server.close(() => {
                logger.info("Server, Postgres, and Redis closed gracefully");
                process.exit(0);
            });
        })
    } catch (error) {
        const logger = await initLogger().catch(() => null);
        logger?.fatal({ err: error }, "Failed to start server");
        if (!logger) {
            console.error("Failed to start server", error);
        }
        await prisma.$disconnect();
        await disconnectRedis();
        process.exit(1);
    }
}

startServer();
