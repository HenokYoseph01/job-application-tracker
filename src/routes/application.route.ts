import { Router } from "express";
import applicationController from "../controllers/application.controller.js";
import { authenticate } from "../middlewares/auth.js";
import {
  validateApplicationId,
  validateApplicationQuery,
  validateCreateApplication,
  validateUpdateApplication
} from "../middlewares/validate.js";

//Create a router for the application routes
const router = Router();

router.get("/", validateApplicationQuery, applicationController.getAllApplications);
router.use(authenticate);
router.get("/stats", applicationController.getApplicationStats);
router.post("/", validateCreateApplication, applicationController.createApplication);
router.get("/:id", validateApplicationId, applicationController.getApplicationById);
router.patch("/:id", validateApplicationId, validateUpdateApplication, applicationController.updateApplication);
router.delete("/:id", validateApplicationId, applicationController.deleteApplication);   

export default router;
