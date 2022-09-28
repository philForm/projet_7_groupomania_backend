const { Router } = require("express");
const multer = require("multer");

const { createPost, sendAllPosts, modifyPost } = require("../controllers/Post_controller.js")


const postRouter = Router();

postRouter.post("/", createPost);
postRouter.get("/", sendAllPosts)
postRouter.put("/:id", modifyPost);


module.exports = postRouter;