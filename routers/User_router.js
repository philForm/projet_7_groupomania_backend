import { Router } from "express";
import { getAllUsers, getOneUser, signupUser } from "../controllers/User_controller.js";

const userRouter = Router();


userRouter.get('/', getAllUsers);
userRouter.get('/:id', getOneUser);

userRouter.post('/signup', signupUser);


export default userRouter;
