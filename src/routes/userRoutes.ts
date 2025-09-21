import { Router } from "express";

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
} from "../controllers/userController";
const router = Router();

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
export default router;
