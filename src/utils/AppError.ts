export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly status: string;

    constructor(message:string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 500 ? "error" : "fail"; //If status is 500 or higher, it's an error, otherwise it's a fail because it's a client error
        this.isOperational = true; //Exceptions based on user provides something invalid or timeouts, etc. Non programattic errors

        Error.captureStackTrace(this, this.constructor); //Gives info where in the code the error has occured, and not in the AppError class itself
    }   
}