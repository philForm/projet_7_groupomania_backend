const { Router } = require("express");
const auth = require("../middleware/auth")
const multer = require("../middleware/multer_config");

const { createPost, sendAllPosts, modifyPost, deletePost, postUserFind, postLiked } = require("../controllers/Post_controller.js");


const postRouter = Router();

postRouter.post("/", auth, multer, createPost);
postRouter.post("/:id/like", auth, postLiked);

postRouter.get("/", sendAllPosts);
postRouter.get("/:id", postUserFind);

postRouter.put("/:id", auth, multer, modifyPost);

postRouter.delete("/:id", auth, deletePost);


module.exports = postRouter;