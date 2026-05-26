import express, {type Request, type Response, type Application} from "express";
import morgan from "morgan";
import { AppError } from "./utils/AppError.js";
import { geh } from "./middlewares/geh.js";
import { prisma } from "./lib/prisma.js";
import "dotenv/config";
import { connectRedis, disconnectRedis, getRedisClient } from "./lib/redis.js";
import cookieParser from "cookie-parser";

//routes
import applicationRoutes from './routes/application.route.js'
import userRoutes from './routes/user.route.js'

const app: Application = express();
const PORT = 20000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use(morgan("dev"));


app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
})

app.get("/health/redis", async (req: Request, res: Response) => {
    const redisClient = getRedisClient();

    await redisClient.set("health:redis", "ok", {
        EX: 30
    });

    const redisStatus = await redisClient.get("health:redis");

    res.status(200).json({
        status: "ok",
        redis: redisStatus
    });
})

app.get("/api/v1", (req: Request, res: Response) => {
    res.status(200).json({ message: "AOI version active" });
})

app.use("/api/v1/applications", applicationRoutes);

app.use("/api/v1/users", userRoutes);



// Handle 404 errors for undefined routes
app.use((req: Request, res:Response) => {
    res.status(404).json({ error: "Not Found" });
})

app.use(geh);

const startServer = async () => {
    try {
        await connectRedis();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        })

        //Graceful shutdown
        process.on("SIGINT", async() => {
            await prisma.$disconnect();
            await disconnectRedis();
            server.close(() => {
                console.log("Server, Postgres, and Redis closed gracefully");
                process.exit(0);
            });
        })
    } catch (error) {
        console.error("Failed to start server", error);
        await prisma.$disconnect();
        await disconnectRedis();
        process.exit(1);
    }
}

startServer();
