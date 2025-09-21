import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  acceptFriendRequest,
  cancelFriendRequestService,
  findAllusers,
  findUser,
  getAllusers,
  getFollowersByUserService,
  getFollowing,
  getFollowingByUserService,
  getFollowrs,
  getOnlineFriendsService,
  getSuggestedUsers,
  getUserById,
  sendFriendRequest,
  findUserByEmail,
} from "../services/userService";

export const CurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user.id });
};

export const getAllUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  const userId = req.user?.id?._id;
  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token" });
  }

  try {
    const findUsers = await getAllusers(userId);

    return res.status(200).json({
      success: true,
      erro: false,
      findUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching posts",
      success: false,
      erro: true,
      error: (error as Error).message,
    });
  }
};

export const FindAllUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const findUsers = await findAllusers();

    return res.status(200).json({
      success: true,
      erro: false,
      findUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching posts",
      success: false,
      erro: true,
      error: (error as Error).message,
    });
  }
};

export const findUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const findUser = await getUserById(userId);

    return res.status(200).json({
      findUser: findUser.user,
      likes: findUser.likesCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching User",
      success: false,
      erro: true,
      error: (error as Error).message,
    });
  }
};

export const getSuggestedUsersController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;
    const users = await getSuggestedUsers(userId);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: (error as Error).message,
    });
  }
};

export const sendFriend = async (req: Request, res: Response) => {
  const result = await sendFriendRequest(
    req.params.userId,
    req.params.targetId
  );
  res.json(result);
};

export const cancelFriendRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id; // ID de l'utilisateur connecté
    const friendId = req.params.friendId; // ID de l'utilisateur cible
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const result = await cancelFriendRequestService(userId, friendId);
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};

export const acceptFriend = async (req: Request, res: Response) => {
  const result = await acceptFriendRequest(
    req.params.userId,
    req.params.senderId
  );
  res.json(result);
};

export const findUserFriends = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const CurrentUser = req.user?.id?._id;

    const result = await findUser(CurrentUser, userId);
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};

export const getOnlineFriendsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;
    const onlineFriends = await getOnlineFriendsService(userId);
    res.json(onlineFriends);
  } catch (error: any) {
    console.error(
      "Erreur lors de la récupération des amis connectés:",
      error.message
    );
    if (error.message === "Utilisateur non trouvé") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getFollowings = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;
    const following = await getFollowing(userId);
    res.json(following);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};

export const getFollowers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;
    const following = await getFollowrs(userId);
    res.json(following);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};

export const getFollowersByUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.id?._id;
    if (!currentUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const followrs = await getFollowersByUserService(userId, currentUserId);
    res.json(followrs);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};

export const getFollowingsByUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.params.userId;

    // Supposons que l'ID de l'utilisateur connecté est disponible dans req.user
    const currentUserId = req.user?.id?._id;
    if (!currentUserId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const following = await getFollowingByUserService(userId, currentUserId);
    res.json(following);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await findUserByEmail(email);
    res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
};
