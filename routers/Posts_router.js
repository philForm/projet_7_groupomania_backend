const { Router } = require("express");
const multer = require("../middleware/multer_config.js");

const { createPost, sendAllPosts, modifyPost, deletePost } = require("../controllers/Post_controller.js");


const postRouter = Router();

postRouter.post("/", createPost);
postRouter.get("/", sendAllPosts);
postRouter.put("/:id", modifyPost);
postRouter.delete("/:id", deletePost);


module.exports = postRouter;