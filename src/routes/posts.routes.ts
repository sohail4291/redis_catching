import express from "express";

import authenticate  from "../middlewares/authenticate.js"
import { requirePermission } from "../middlewares/authorize.js";
import  {checkPostOwnership} from "../middlewares/checkownership.js";
import { getPosts,  getPost, createPost, updatePost,deletePost } from "../controllers/posts.controller.js";

const router = express.Router();

router.get("/", authenticate, getPosts);
router.get("/:id", authenticate, getPost);

router.post("/", authenticate, requirePermission("post:create"), createPost);
router.put("/:id", authenticate, checkPostOwnership(), updatePost);
router.delete("/:id", authenticate, requirePermission("post:delete"), deletePost);

export default router;