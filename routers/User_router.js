import { Router } from "express";
import { getAllUsers } from "../controllers/User_controller.js";

const userRouter = Router();

userRouter.get('/', getAllUsers);

export default userRouter;
