import { type NextFunction, type Request, type Response } from "express";
import { z, type ZodType } from "zod";
import { Status, WorkMode } from "../../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Must be a valid date string",
});

const positiveIntegerString = z.string().refine((value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0;
}, {
    message: "Must be a positive integer",
});

const optionalPositiveIntegerString = positiveIntegerString.optional();

const limitString = z.string().refine((value) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 100;
}, {
    message: "Must be a positive integer between 1 and 100",
}).optional();

const registerSchema = z.object({
    username: z.string().trim().min(1, "username is required"),
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "confirmPassword is required"),
}).strict().refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(1, "password is required"),
}).strict();

const applicationIdSchema = z.object({
    id: positiveIntegerString,
});

const applicationQuerySchema = z.object({
    status: z.enum(Status).optional(),
    companyName: z.string().optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    page: optionalPositiveIntegerString,
    limit: limitString,
}).strict();

const createApplicationSchema = z.object({
    companyName: z.string().trim().min(1, "companyName is required"),
    jobTitle: z.string().trim().min(1, "jobTitle is required"),
    jobUrl: z.string().optional(),
    location: z.string().optional(),
    contactName: z.string().optional(),
    status: z.enum(Status).optional(),
    applicationDate: dateString,
    deadline: dateString,
    notes: z.string().optional(),
    salaryMin: z.number().finite().optional(),
    salaryMax: z.number().finite().optional(),
    workMode: z.enum(WorkMode),
}).strict();

const updateApplicationSchema = createApplicationSchema.partial().refine((data) => {
    return Object.keys(data).length > 0;
}, {
    message: "At least one field is required to update an application",
});

const formatZodError = (error: z.ZodError) => {
    return error.issues
        .map((issue) => {
            const path = issue.path.join(".");
            return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("; ");
};

const parseOrThrow = <T>(schema: ZodType<T>, value: unknown) => {
    const result = schema.safeParse(value);

    if (!result.success) {
        throw new AppError(formatZodError(result.error), 400);
    }

    return result.data;
};

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = parseOrThrow(registerSchema, req.body);
        next();
    } catch (error) {
        next(error);
    }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = parseOrThrow(loginSchema, req.body);
        next();
    } catch (error) {
        next(error);
    }
};

export const validateApplicationId = (req: Request, res: Response, next: NextFunction) => {
    try {
        req.params = parseOrThrow(applicationIdSchema, req.params);
        next();
    } catch (error) {
        next(error);
    }
};

export const validateApplicationQuery = (req: Request, res: Response, next: NextFunction) => {
    try {
        req.query = parseOrThrow(applicationQuerySchema, req.query) as typeof req.query;
        next();
    } catch (error) {
        next(error);
    }
};

export const validateCreateApplication = (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = parseOrThrow(createApplicationSchema, req.body);
        next();
    } catch (error) {
        next(error);
    }
};

export const validateUpdateApplication = (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = parseOrThrow(updateApplicationSchema, req.body);
        next();
    } catch (error) {
        next(error);
    }
};
