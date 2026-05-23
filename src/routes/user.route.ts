import {Router} from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/profile", authenticate, userController.getUserProfile);
router.get("/refresh", userController.refresh);


export default router;