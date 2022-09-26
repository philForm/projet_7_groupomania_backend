import { Router } from "express";
import { multer } from "../middleware/multer_config.js"
import { getAllUsers, getOneUser, signupUser, loginUser } from "../controllers/User_controller.js";

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getOneUser);

userRouter.post('/signup', multer, signupUser);
userRouter.post('/login', loginUser);


export default userRouter;
