const { Router } = require("express");
const multer = require("../middleware/multer_config");
const { getAllUsers, getOneUser, signupUser, loginUser, addUserAvatar } = require("../controllers/User_controller.js");

const userRouter = Router();

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getOneUser);

userRouter.post('/signup', multer, signupUser);
userRouter.post('/login', loginUser);

userRouter.put("/signup/:id", multer, addUserAvatar);

module.exports = userRouter;
