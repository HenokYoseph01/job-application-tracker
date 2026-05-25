import { Router } from "express";
import applicationController from "../controllers/application.controller.js";
import { authenticate } from "../middlewares/auth.js";

//Create a router for the application routes
const router = Router();

router.get("/", applicationController.getAllApplications);
router.use(authenticate);
router.get("/stats", applicationController.getApplicationStats);
router.post("/", applicationController.createApplication);
router.get("/:id", applicationController.getApplicationById);
router.patch("/:id", applicationController.updateApplication);
router.delete("/:id", applicationController.deleteApplication);   

export default router;
