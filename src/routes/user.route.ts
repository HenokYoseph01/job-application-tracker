import {Router} from 'express';
import userController from '../controllers/user.controller.js';

const router = Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/profile", userController.getUserProfile);


export default router;