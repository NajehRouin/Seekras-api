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
import { uploadToCloudinary } from "../utils/cloudinary";
import UserModel from "../models/User";
import UserProfileModel from "../models/UserProfile";

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

export const UpdateBasicInfo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { username, bio, email, location, favoriteActivities } = req.body;

  try {
    const findCurrentUser = await UserModel.findById(req.user?.id?._id);
    const findProfil = await UserProfileModel.findOne({
      _id: findCurrentUser?.profileId,
    });

    if (!findCurrentUser || !findProfil) {
      return res
        .status(404)
        .json({ error: "Utilisateur ou profil non trouvé" });
    }

    const profileUpdate: any = {
      $set: {
        fullName: username || findProfil.fullName,
        location: location || findProfil.location,
        bio: bio || findProfil.bio,
      },
    };

    let activitiesToUpdate = JSON.parse(favoriteActivities);

    if (activitiesToUpdate.length > 0) {
      profileUpdate.$set.favoriteActivities = activitiesToUpdate;
    }
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, {
        folder: "seekras/profile",
      });
      profileUpdate.$set.profileImage = result?.url;
    }

    await UserProfileModel.findOneAndUpdate(
      { _id: findCurrentUser.profileId },
      profileUpdate,
      { new: true }
    );

    await UserModel.findByIdAndUpdate(
      { _id: req.user?.id?._id },
      {
        email: email || findCurrentUser.email,
        firstName: username || findCurrentUser.firstName,
        lastName: username || findCurrentUser.lastName,
      },
      { new: true }
    );

    return res.status(200).json({ message: "Modifié avec succès" });
  } catch (error) {
    console.error("Erreur :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

export const UpdatePrivacySettings = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { privacySettings } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const findCurrentUser = await UserModel.findById(req.user?.id?._id);
    const findProfil = await UserProfileModel.findOne({
      _id: findCurrentUser?.profileId,
    });

    if (!findCurrentUser || !findProfil) {
      return res
        .status(404)
        .json({ error: "Utilisateur ou profil non trouvé" });
    }

    // Valider et parser privacySettings
    let settingsToUpdate: {
      showVisitedPlaces: boolean;
      showAchievements: boolean;
      allowTagging: boolean;
      publicProfile: boolean;
    };

    try {
      settingsToUpdate = JSON.parse(privacySettings);
      if (
        typeof settingsToUpdate !== "object" ||
        typeof settingsToUpdate.showVisitedPlaces !== "boolean" ||
        typeof settingsToUpdate.showAchievements !== "boolean" ||
        typeof settingsToUpdate.allowTagging !== "boolean" ||
        typeof settingsToUpdate.publicProfile !== "boolean"
      ) {
        return res
          .status(400)
          .json({ error: "Format invalide pour privacySettings" });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Format JSON invalide pour privacySettings" });
    }

    // Mettre à jour le profil
    const profileUpdate = {
      $set: {
        privacySettings: settingsToUpdate,
      },
    };

    const updatedProfile = await UserProfileModel.findOneAndUpdate(
      { _id: findCurrentUser.profileId },
      profileUpdate,
      { new: true }
    );

    await UserProfileModel.findOneAndUpdate(
      { _id: findCurrentUser.profileId },
      { profilPublic: settingsToUpdate.publicProfile },
      { new: true }
    );

    return res.status(200).json({
      message: "Paramètres de confidentialité mis à jour avec succès",
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("Erreur complète :", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur", details: error.message });
  }
};

export const updatNotification = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { notificationSettings } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const findCurrentUser = await UserModel.findById(req.user?.id?._id);
    const findProfil = await UserProfileModel.findOne({
      _id: findCurrentUser?.profileId,
    });

    if (!findCurrentUser || !findProfil) {
      return res
        .status(404)
        .json({ error: "Utilisateur ou profil non trouvé" });
    }

    // Valider et parser privacySettings
    let settingsToUpdate: {
      newComments: boolean;
      newLikes: boolean;
      newFollowers: boolean;
      appUpdates: boolean;
    };

    try {
      settingsToUpdate = JSON.parse(notificationSettings);
      if (
        typeof settingsToUpdate !== "object" ||
        typeof settingsToUpdate.newComments !== "boolean" ||
        typeof settingsToUpdate.newLikes !== "boolean" ||
        typeof settingsToUpdate.newFollowers !== "boolean" ||
        typeof settingsToUpdate.appUpdates !== "boolean"
      ) {
        return res
          .status(400)
          .json({ error: "Format invalide pour notificationSettings" });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Format JSON invalide pour notificationSettings" });
    }

    // Mettre à jour le profil
    const profileUpdate = {
      $set: {
        notificationSettings: settingsToUpdate,
      },
    };

    const updatedProfile = await UserProfileModel.findOneAndUpdate(
      { _id: findCurrentUser.profileId },
      profileUpdate,
      { new: true }
    );

    return res.status(200).json({
      message: "Paramètres de confidentialité mis à jour avec succès",
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("Erreur complète :", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur", details: error.message });
  }
};
