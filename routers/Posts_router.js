const { Router } = require("express");
const multer = require("multer");

const { createPost } = require("../controllers/Post_controller.js")


const postRouter = Router();

postRouter.post("/", createPost);


module.exports = postRouter;