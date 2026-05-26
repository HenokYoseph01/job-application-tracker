import {type Request, type Response} from "express";
import {prisma} from "../lib/prisma.js";
import { Status } from "../../generated/prisma/client.js";
import type { Prisma, WorkMode } from "../../generated/prisma/client.js";
import { getRedisClient } from "../lib/redis.js";
import { redisKeys } from "../utils/redisKeys.js";

const DASHBOARD_STATS_TTL_SECONDS = 60;

type CreateApplicationBody = {
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  location?: string;
  contactName?: string;
  status?: Status;
  applicationDate: string;
  deadline: string;
  notes?: string;
  salaryMin?: number;
  salaryMax?: number;
  workMode: WorkMode;
};

type UpdateApplicationBody = Partial<CreateApplicationBody>;

type ApplicationParams = {
    id: string;
};

type GetApplicationsQuery = {
    status?: Status;
    companyName?: string;
    sort?: "asc" | "desc";
    page?: string;
    limit?: string;
};

const isStatus = (value: string): value is Status => {
    return Object.values(Status).includes(value as Status);
};

const getApplicationStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 401,
                error: "Unauthorized"
            });
        }

        const redisClient = getRedisClient();
        const cacheKey = redisKeys.dashboardStats(userId);
        const cachedStats = await redisClient.get(cacheKey);

        if (cachedStats) {
            return res.status(200).json({
                status: 200,
                source: "cache",
                data: JSON.parse(cachedStats)
            });
        }

        const now = new Date();
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const [
            totalApplications,
            applicationsByStatus,
            upcomingDeadlines,
            recentApplications
        ] = await Promise.all([
            prisma.application.count({
                where: {
                    userId
                }
            }),
            prisma.application.groupBy({
                by: ["status"],
                where: {
                    userId
                },
                _count: {
                    status: true
                }
            }),
            prisma.application.findMany({
                where: {
                    userId,
                    deadline: {
                        gte: now,
                        lte: thirtyDaysFromNow
                    }
                },
                orderBy: {
                    deadline: "asc"
                },
                take: 5
            }),
            prisma.application.findMany({
                where: {
                    userId
                },
                orderBy: {
                    applicationDate: "desc"
                },
                take: 5
            })
        ]);

        const statusCounts = Object.fromEntries(
            Object.values(Status).map((status) => [status, 0])
        ) as Record<Status, number>;

        for (const statusGroup of applicationsByStatus) {
            statusCounts[statusGroup.status] = statusGroup._count.status;
        }

        const stats = {
            totalApplications,
            applicationsByStatus: statusCounts,
            upcomingDeadlines,
            recentApplications
        };

        await redisClient.set(cacheKey, JSON.stringify(stats), {
            EX: DASHBOARD_STATS_TTL_SECONDS
        });

        res.status(200).json({
            status: 200,
            source: "database",
            data: stats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            error: "Internal Server Error"
        });
    }
}


const getAllApplications = async (
    req: Request<unknown, unknown, unknown, GetApplicationsQuery>,
    res: Response
) => {
    console.log("Fetching all applications...");
    try {
        const { status, companyName, sort = "desc" } = req.query;
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        if (status && !isStatus(status)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid status filter"
            });
        }

        if (sort !== "asc" && sort !== "desc") {
            return res.status(400).json({
                status: 400,
                error: "Sort must be either asc or desc"
            });
        }

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                status: 400,
                error: "Page must be a positive integer"
            });
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                status: 400,
                error: "Limit must be a positive integer between 1 and 100"
            });
        }

        const where: Prisma.ApplicationWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (companyName) {
            where.companyName = {
                contains: companyName,
                mode: "insensitive"
            };
        }

        const total = await prisma.application.count({ where });
        const applications = await prisma.application.findMany({
            where,
            orderBy: {
                applicationDate: sort
            },
            skip: (page - 1) * limit,
            take: limit
        });

        res.status(200).json({
            status: 200,
            results: applications.length,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: applications
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: 500,
            error: "Internal Server Error"
        });
    }
    
}

const createApplication = async(req: Request, res: Response) => {
    try {
        const {
            companyName,
            jobTitle,
            jobUrl,
            location,
            contactName,
            status,
            applicationDate,
            deadline,
            notes,
            salaryMin,
            salaryMax,
            workMode,
        } = req.body as CreateApplicationBody;

        if (!companyName || !jobTitle || !applicationDate || !deadline || !workMode) {
            return res.status(400).json({
                status: 400,
                error: "Missing required fields"
            });
        }

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 401,
                error: "Unauthorized"
            });
        }

        const redisClient = getRedisClient();
        const newApplication = await prisma.application.create({
            data: {
                ...req.body,
                userId
            }
        });

        await redisClient.del(redisKeys.dashboardStats(userId));

        console.log("Created new application:", newApplication);

        if(!newApplication) {
            return res.status(500).json({
                status: 500,
                error: "Failed to create application"
            });
        }

        res.status(201).json({
            status: 201,
            data: newApplication
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 400,
            error: "Bad Request"
        });
    }
}

const getApplicationById = async (req: Request<ApplicationParams>, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user?.id;

        if (Number.isNaN(id)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid application id"
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 401,
                error: "Unauthorized"
            });
        }

        const application = await prisma.application.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!application) {
            return res.status(404).json({
                status: 404,
                error: "Application not found"
            });
        }

        res.status(200).json({
            status: 200,
            data: application
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            error: "Internal Server Error"
        });
    }
}

const updateApplication = async (
    req: Request<ApplicationParams, unknown, UpdateApplicationBody>,
    res: Response
) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user?.id;

        if (Number.isNaN(id)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid application id"
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 401,
                error: "Unauthorized"
            });
        }

        const redisClient = getRedisClient();
        const {
            companyName,
            jobTitle,
            jobUrl,
            location,
            contactName,
            status,
            applicationDate,
            deadline,
            notes,
            salaryMin,
            salaryMax,
            workMode
        } = req.body;

        const data: Prisma.ApplicationUncheckedUpdateInput = {};

        if (companyName !== undefined) data.companyName = companyName;
        if (jobTitle !== undefined) data.jobTitle = jobTitle;
        if (jobUrl !== undefined) data.jobUrl = jobUrl;
        if (location !== undefined) data.location = location;
        if (contactName !== undefined) data.contactName = contactName;
        if (status !== undefined) data.status = status;
        if (applicationDate !== undefined) data.applicationDate = applicationDate;
        if (deadline !== undefined) data.deadline = deadline;
        if (notes !== undefined) data.notes = notes;
        if (salaryMin !== undefined) data.salaryMin = salaryMin;
        if (salaryMax !== undefined) data.salaryMax = salaryMax;
        if (workMode !== undefined) data.workMode = workMode;

        const application = await prisma.application.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!application) {
            return res.status(404).json({
                status: 404,
                error: "Application not found"
            });
        }

        const updatedApplication = await prisma.application.update({
            where: {
                id: application.id
            },
            data
        });

        await redisClient.del(redisKeys.dashboardStats(userId));

        res.status(200).json({
            status: 200,
            data: updatedApplication
        });
    } catch (error: any) {
        console.error(error);

        if (error.code === "P2025") {
            return res.status(404).json({
                status: 404,
                error: "Application not found"
            });
        }

        res.status(400).json({
            status: 400,
            error: "Bad Request"
        });
    }
}

const deleteApplication = async (req: Request<ApplicationParams>, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user?.id;

        if (Number.isNaN(id)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid application id"
            });
        }

        if (!userId) {
            return res.status(401).json({
                status: 401,
                error: "Unauthorized"
            });
        }

        const redisClient = getRedisClient();
        const application = await prisma.application.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!application) {
            return res.status(404).json({
                status: 404,
                error: "Application not found"
            });
        }

        await prisma.application.delete({
            where: {
                id: application.id
            }
        });

        await redisClient.del(redisKeys.dashboardStats(userId));

        res.status(204).send();
    } catch (error: any) {
        console.error(error);

        if (error.code === "P2025") {
            return res.status(404).json({
                status: 404,
                error: "Application not found"
            });
        }

        res.status(500).json({
            status: 500,
            error: "Internal Server Error"
        });
    }
}


export default {    
    getApplicationStats,
    getAllApplications,
    createApplication,
    getApplicationById,
    updateApplication,
    deleteApplication
}
