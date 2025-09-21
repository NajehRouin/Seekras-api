import express from "express";
import upload from "../middlewares/upload";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  checkPostLikeController,
  createCommentController,
  createPostController,
  deleteCommentController,
  deletePostController,
  deleteSharedPostController,
  filterPostByUser,
  getAllPostsController,
  getCommentsController,
  getLikesController,
  getPostById,
  getPostComments,
  getPostOffcurrentuser,
  getSharedPostsController,
  likePostController,
  sharePostController,
} from "../controllers/posts";

const router = express.Router();

//get All Post

router.get("/posts", authenticateToken, (req, res, next) => {
  getAllPostsController(req, res).catch(next);
});

router.post("/postById", (req, res, next) => {
  getPostById(req, res).catch(next);
});

router.post(
  "/create-post",
  authenticateToken,
  upload.array("mediaUrls", 10),
  (req, res, next) => {
    createPostController(req, res).catch(next);
  }
);

router.get("/PostCurrentUser", authenticateToken, (req, res, next) => {
  getPostOffcurrentuser(req, res).catch(next);
});

// Route for deleting a post
router.delete("/delete-post", authenticateToken, (req, res, next) => {
  deletePostController(req, res).catch(next);
});

// // Route for like and dislike a post
// router.post("/like-post", authenticateToken, (req, res, next) => {
//   likePostController(req, res).catch(next);
// });

// Route for getting likes of a post
router.get("/likes/:postId", (req, res, next) => {
  getLikesController(req, res).catch(next);
});

// Route for commenting a post
router.post("/comment-post", authenticateToken, (req, res, next) => {
  createCommentController(req, res).catch(next);
});

//Route fo getting Comments of o post

router.get("/posts/:postId/comments", getPostComments);

// Route for deleting a comment
router.delete("/comment-post/:commentId", (req, res, next) => {
  deleteCommentController(req, res).catch(next);
});

// Route for getting comments of a post
router.get("/comments/:postId", (req, res, next) => {
  getCommentsController(req, res).catch(next);
});

// Route for sharing a post
router.post("/share", authenticateToken, (req, res, next) => {
  sharePostController(req, res).catch(next);
});

// Route for getting shared posts by a user
router.get("/:userId/shared", (req, res, next) => {
  getSharedPostsController(req, res).catch(next);
});

// Route for deleting a shared post
router.delete("/shared/:postId", authenticateToken, (req, res, next) => {
  deleteSharedPostController(req, res).catch(next);
});

router.post("/posts/like", authenticateToken, (req, res, next) => {
  likePostController(req, res).catch(next);
});
router.get("/posts/:postId/like", authenticateToken, (req, res, next) => {
  checkPostLikeController(req, res).catch(next);
});

router.get("/filterPost", (req, res, next) => {
  filterPostByUser(req, res).catch(next);
});

export default router;
