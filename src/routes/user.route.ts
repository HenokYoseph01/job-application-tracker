import {Router} from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateLogin, validateRegister } from '../middlewares/validate.js';

const router = Router();

router.post("/register", validateRegister, userController.registerUser);
router.post("/login", validateLogin, userController.loginUser);
router.get("/profile", authenticate, userController.getUserProfile);
router.get("/refresh", userController.refresh);


export default router;
