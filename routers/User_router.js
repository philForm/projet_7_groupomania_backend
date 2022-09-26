import { Router } from "express";
import { getAllUsers, getOneUser, signupUser, loginUser } from "../controllers/User_controller.js";

const userRouter = Router();


userRouter.get('/', getAllUsers);
userRouter.get('/:id', getOneUser);

userRouter.post('/signup', signupUser);
userRouter.post('/login', loginUser);


export default userRouter;
