import express, {type Request, type Response, type Application} from "express";
import morgan from "morgan";
import { AppError } from "./utils/AppError.js";
import { geh } from "./middlewares/geh.js";
import { prisma } from "./lib/prisma.js";
const app: Application = express();
const PORT = 20000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));


app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
})

app.get("/api/v1", (req: Request, res: Response) => {
    res.status(200).json({ message: "AOI version active" });
})

app.get("/", (req: Request, res: Response) => {
    throw new AppError("OH NO", 400);
})

// Handle 404 errors for undefined routes
app.use((req: Request, res:Response) => {
    res.status(404).json({ error: "Not Found" });
})

app.use(geh);

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})


//Graceful shutdown
process.on("SIGINT", async() => {
    await prisma.$disconnect();
    server.close(() => {
        console.log("Server and Postgres closed gracefully");
        process.exit(0);
    });
})