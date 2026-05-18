import {type Request, type Response} from "express";
import {prisma} from "../lib/prisma.js";


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

const createApplication = (req: Request, res: Response) => {}

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