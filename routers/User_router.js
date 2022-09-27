const { Router } = require("express");
const multer = require("../middleware/multer_config");
const { getAllUsers, getOneUser, signupUser, loginUser } = require("../controllers/User_controller.js");

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getOneUser);

userRouter.post('/signup', multer, signupUser);
userRouter.post('/login', loginUser);

module.exports = userRouter;
