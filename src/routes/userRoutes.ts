import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  acceptFriend,
  cancelFriendRequest,
  CurrentUser,
  FindAllUser,
  findUserById,
  findUserFriends,
  getAllUser,
  getFollowers,
  getFollowersByUser,
  getFollowings,
  getFollowingsByUser,
  getOnlineFriendsController,
  getSuggestedUsersController,
  sendFriend,
  getUserByEmail,
  UpdateBasicInfo,
  UpdatePrivacySettings,
  updatNotification,
} from "../controllers/userController";
const router = Router();
import upload from "../middlewares/uploadProfil";

router.get("/currentUser", authenticateToken, CurrentUser);

router.get("/allUsers", authenticateToken, getAllUser);
router.get("/findAllUsers", FindAllUser);

router.get("/finduserById/:userId", findUserById);

router.post("/:userId/friend-request/:targetId", sendFriend);
router.post("/cancel-friend/:friendId", authenticateToken, cancelFriendRequest);

router.post("/:userId/accept-friend/:senderId", acceptFriend);

router.get("/suggested", authenticateToken, getSuggestedUsersController);

router.get("/findUser/:userId", authenticateToken, findUserFriends);
router.get("/online-friends", authenticateToken, getOnlineFriendsController);

router.get("/following", authenticateToken, getFollowings);
router.get("/followers", authenticateToken, getFollowers);

router.get("/followingByUser/:userId", authenticateToken, getFollowingsByUser);
router.get("/followersByUser/:userId", authenticateToken, getFollowersByUser);

router.post("/getUserByEmail", getUserByEmail);

router.post(
  "/updateBasicInfo",
  authenticateToken,
  upload.single("image"),
  (req, res, next) => {
    UpdateBasicInfo(req, res).catch(next);
  }
);

router.post(
  "/UpdatePrivacy",
  authenticateToken,
  upload.none(),
  (req, res, next) => {
    UpdatePrivacySettings(req, res).catch(next);
  }
);

router.post(
  "/updatNotification",
  authenticateToken,
  upload.none(),
  (req, res, next) => {
    updatNotification(req, res).catch(next);
  }
);

export default router;
