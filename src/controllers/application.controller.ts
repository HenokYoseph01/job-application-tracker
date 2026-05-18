import {type Request, type Response} from "express";
import {prisma} from "../lib/prisma.js";
import type { Prisma, Status, WorkMode } from "../../generated/prisma/client.js";

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
  userId: number;
};

type UpdateApplicationBody = Partial<CreateApplicationBody>;

type ApplicationParams = {
    id: string;
};


const getAllApplications = async (req: Request, res: Response) => {
    console.log("Fetching all applications...");
    try {
        const applications = await prisma.application.findMany();
        res.status(200).json({
            status: 200,
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
            userId
        } = req.body as CreateApplicationBody;

        if (!companyName || !jobTitle || !applicationDate || !deadline || !workMode || !userId) {
            return res.status(400).json({
                status: 400,
                error: "Missing required fields"
            });
        }

        const newApplication = await prisma.application.create({
            data: req.body
        });

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

        if (Number.isNaN(id)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid application id"
            });
        }

        const application = await prisma.application.findUnique({
            where: {
                id
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

        if (Number.isNaN(id)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid application id"
            });
        }

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
            userId
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
        if (userId !== undefined) data.userId = userId;

        const updatedApplication = await prisma.application.update({
            where: {
                id
            },
            data
        });

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

        if (Number.isNaN(id)) {
            return res.status(400).json({
                status: 400,
                error: "Invalid application id"
            });
        }

        await prisma.application.delete({
            where: {
                id
            }
        });

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
    getAllApplications,
    createApplication,
    getApplicationById,
    updateApplication,
    deleteApplication
}
