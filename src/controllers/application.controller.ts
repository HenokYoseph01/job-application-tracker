import {type Request, type Response} from "express";
import {prisma} from "../lib/prisma.js";
import type { Status, WorkMode } from "../../generated/prisma/client.js";

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

const getApplicationById = (req: Request, res: Response) => {}

const updateApplication = (req: Request, res: Response) => {}

const deleteApplication = (req: Request, res: Response) => {}


export default {    
    getAllApplications,
    createApplication,
    getApplicationById,
    updateApplication,
    deleteApplication
}