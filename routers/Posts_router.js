const { Router } = require("express");
const auth = require("../middleware/auth")
const multer = require("../middleware/multer_config");

const { createPost, sendAllPosts, modifyPost, deletePost, postUserFind } = require("../controllers/Post_controller.js");


const postRouter = Router();

postRouter.post("/", auth, multer, createPost);
// postRouter.post("/like/:id", auth, "");

postRouter.get("/", sendAllPosts);
postRouter.get("/:id", postUserFind);

postRouter.put("/:id", auth, multer, modifyPost);

postRouter.delete("/:id", auth, deletePost);


module.exports = postRouter;