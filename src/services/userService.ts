import UserModel from "../models/User";
import Product from "../models/Products";
import { Types } from "mongoose";
import Notification from "../models/Notification";
import { io } from "../index";
import { onlineUsers } from "../utils/onlineUsers";
import PostsModel from "../models/Posts";

import { getOnlineUsers } from "../utils/onlineUsers";
import nodemailer from "nodemailer";
interface OnlineFriend {
  id: string;
  firstName: string;
  fullName: string;
  profileImage: string;
  status: boolean;
}
// Fonction utilitaire pour générer un code aléatoire à 4 chiffres
const generateCode = (): number => {
  return Math.floor(1000 + Math.random() * 9000); // 1000 -> 9999
};

export const getAllusers = async (userId: string) => {
  try {
    const findUsers = await UserModel.find({ _id: { $ne: userId } }).populate(
      "profileId",
      "profileImage fullName"
    );
    return findUsers;
  } catch (error: any) {
    throw new Error("Error fetching Users: " + error.message || String(error));
  }
};

export const findAllusers = async () => {
  try {
    const findUsers = await UserModel.find().populate(
      "profileId",
      "profileImage fullName"
    );

    return findUsers;
  } catch (error: any) {
    throw new Error("Error fetching Users: " + error.message || String(error));
  }
};

export const getUserById = async (userId: string) => {
  try {
    const findUser = await UserModel.findById({ _id: userId }).populate(
      "profileId",
      "profileImage fullName"
    );

    const likes = await Product.find({ likedBy: userId }).lean();
    return {
      user: findUser,
      likesCount: likes.length,
    };
  } catch (error: any) {
    throw new Error("Error fetching Users: " + error.message || String(error));
  }
};

export const findUser = async (UserCurrent: string, userId: string) => {
  try {
    // Récupérer l'utilisateur connecté avec ses listes de relations
    const currentUser = await UserModel.findById(UserCurrent)
      .populate("profileId", "profileImage fullName")
      .select("followers following friendRequestsReceived friendRequestsSent");

    // Récupérer l'utilisateur cible
    const findUser = await UserModel.findById(userId).populate(
      "profileId",
      "profileImage fullName"
    );

    if (!currentUser || !findUser) {
      throw new Error("User or target user not found");
    }

    // Récupérer les posts actifs de l'utilisateur cible
    const posts = await PostsModel.find({
      userId: userId,
      active: true,
    });

    // Si l'utilisateur connecté est l'utilisateur cible
    if (UserCurrent === userId) {
      return {
        user: currentUser,
        isFollowing: true,
        isAccepte: false,
        isSent: false,
        posts: posts,
      };
    }

    // Déterminer les statuts de relation avec vérifications défensives
    const isFollowing =
      currentUser.following?.some((f) => f.toString() === userId) ||
      false ||
      currentUser.followers?.some((f) => f.toString() === userId) ||
      false ||
      currentUser.friends?.some((f) => f.toString() === userId) ||
      false;

    const isAccepte =
      currentUser.friendRequestsReceived?.some(
        (f) => f.toString() === userId
      ) || false;

    const isSent =
      currentUser.friendRequestsSent?.some((f) => f.toString() === userId) ||
      false;

    return {
      user: findUser,
      isFollowing,
      isAccepte,
      isSent,
      posts,
    };
  } catch (error: any) {
    throw new Error("Error fetching user: " + (error.message || String(error)));
  }
};

export const getFollowing = async (userId: string) => {
  const user = await UserModel.findById(userId).populate({
    path: "following",
    select: "firstName profileId",
    populate: {
      path: "profileId",
      select: "fullName profileImage",
    },
  });

  if (!user) throw new Error("User not found");
  return user.following;
};

export const getFollowrs = async (userId: string) => {
  const user = await UserModel.findById(userId).populate({
    path: "followers",
    select: "firstName profileId",
    populate: {
      path: "profileId",
      select: "fullName profileImage",
    },
  });

  if (!user) throw new Error("User not found");
  return user.followers;
};

export const sendFriendRequest = async (userId: string, targetId: string) => {
  if (userId === targetId) {
    throw new Error("Cannot send friend request to yourself");
  }

  const user = await UserModel.findById(userId);
  const targetUser = await UserModel.findById(targetId).populate({
    path: "profileId",
    select: "profilPublic",
  });

  if (!user || !targetUser) {
    throw new Error("User or target user not found");
  }
  const isProfilePublic = (targetUser.profileId as any).profilPublic;
  //push la notification if targetId profil private
  if (isProfilePublic === false) {
    if (
      user.friends.includes(new Types.ObjectId(targetId)) ||
      user.friendRequestsSent.includes(new Types.ObjectId(targetId))
    ) {
      throw new Error(
        "Friend request already sent or users are already friends"
      );
    }

    user.friendRequestsSent.push(new Types.ObjectId(targetId));
    targetUser.friendRequestsReceived.push(new Types.ObjectId(userId));

    await user.save();
    await targetUser.save();

    // Créer une notification
    const notification = new Notification({
      recipient: targetUser._id,
      sender: user._id,
      type: "friend_request",
    });

    await notification.save();

    // Envoyer la notification en temps réel si l'utilisateur cible est en ligne
    const targetSocketId = onlineUsers.get(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("new_notification", notification);
    }

    return { message: "Friend request sent successfully" };
  } else {
    // Ajouter mutuellement aux amis
    if (!user.friends.includes(new Types.ObjectId(targetId))) {
      user.friends.push(new Types.ObjectId(targetId));
    }

    if (!targetUser.friends.includes(new Types.ObjectId(userId))) {
      targetUser.friends.push(new Types.ObjectId(userId));
    }

    // Ajouter dans following / followers
    if (!user.following.includes(new Types.ObjectId(targetId))) {
      user.following.push(new Types.ObjectId(targetId));
    }

    if (!targetUser.followers.includes(new Types.ObjectId(userId))) {
      targetUser.followers.push(new Types.ObjectId(userId));
    }
    // Retirer la demande des listes
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      (id) => !id.equals(targetId)
    );

    targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
      (id) => !id.equals(userId)
    );

    await user.save();
    await targetUser.save();

    return {
      message: "Friend request accepted successfully",
    };
  }
};

export const cancelFriendRequestService = async (
  userId: string,
  friendId: string
) => {
  // Vérifier que l'utilisateur connecté existe
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  // Vérifier que l'utilisateur cible existe
  const friend = await UserModel.findById(friendId);
  if (!friend) throw new Error("Friend not found");

  // Vérifier que la demande d'ami existe
  if (!user.friendRequestsSent.includes(new Types.ObjectId(friendId))) {
    throw new Error("No friend request sent to this user");
  }

  // Supprimer friendId de friendRequestsSent de l'utilisateur connecté
  await UserModel.findByIdAndUpdate(userId, {
    $pull: { friendRequestsSent: friendId },
  });

  // Supprimer userId de friendRequestsReceived de l'utilisateur cible
  await UserModel.findByIdAndUpdate(friendId, {
    $pull: { friendRequestsReceived: userId },
  });

  return { message: "Friend request cancelled successfully" };
};

export const acceptFriendRequest = async (userId: string, senderId: string) => {
  if (userId === senderId) {
    throw new Error("Cannot accept friend request from yourself");
  }

  const user = await UserModel.findById(userId);
  const sender = await UserModel.findById(senderId);

  if (!user || !sender) {
    throw new Error("User or sender not found");
  }

  if (!user.friendRequestsReceived.includes(new Types.ObjectId(senderId))) {
    throw new Error("No friend request found from this user");
  }

  // Ajouter mutuellement aux amis
  if (!user.friends.includes(new Types.ObjectId(senderId))) {
    user.friends.push(new Types.ObjectId(senderId));
  }

  if (!sender.friends.includes(new Types.ObjectId(userId))) {
    sender.friends.push(new Types.ObjectId(userId));
  }

  // Ajouter dans following / followers
  if (!user.following.includes(new Types.ObjectId(senderId))) {
    user.following.push(new Types.ObjectId(senderId));
  }

  if (!sender.followers.includes(new Types.ObjectId(userId))) {
    sender.followers.push(new Types.ObjectId(userId));
  }
  // Retirer la demande des listes
  user.friendRequestsReceived = user.friendRequestsReceived.filter(
    (id) => !id.equals(senderId)
  );

  sender.friendRequestsSent = sender.friendRequestsSent.filter(
    (id) => !id.equals(userId)
  );

  await user.save();
  await sender.save();

  return { message: "Friend request accepted successfully", user, sender };
};

export const getFriends = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .populate("friends", "firstName lastName")
    .select("friends");
  if (!user) throw new Error("User not found");
  return user.friends;
};

export const getSuggestedUsers = async (userId: string) => {
  const user = await UserModel.findById(userId).populate(
    "friends followers following",
    "_id"
  );

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  const excludedUserIds = [
    user._id,
    ...user.friends.map((f) => f._id),
    ...user.followers.map((f) => f._id),
    ...user.following.map((f) => f._id),
  ];

  const suggestedUsers = await UserModel.find({
    _id: { $nin: excludedUserIds },
  })
    .populate("profileId", "profileImage fullName")
    .select("firstName lastName email");

  return suggestedUsers;
};

export const getOnlineFriendsService = async (
  userId: string
): Promise<OnlineFriend[]> => {
  // Récupérer l'utilisateur avec ses amis
  const user = await UserModel.findById(userId)
    .populate({
      path: "friends",
      select: "firstName profileId",
      populate: {
        path: "profileId",
        select: "fullName profileImage isOnline",
      },
    })
    .lean();

  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  // Filtrer les amis connectés
  const onlineUsers = getOnlineUsers();
  const onlineFriends = user.friends
    .filter((friend: any) => onlineUsers.includes(friend._id.toString()))
    .map((friend: any) => ({
      id: friend._id.toString(),
      firstName: friend.firstName,
      fullName: friend.profileId.fullName,
      profileImage:
        friend.profileId.profileImage || "https://via.placeholder.com/50",
      status: true, // Ami connecté
    }));

  return onlineFriends;
};

export const getFollowingByUserService = async (
  userId: string,
  currentUserId: string
) => {
  // Récupérer l'utilisateur cible avec ses followings
  const user = await UserModel.findById(userId).populate({
    path: "following",
    select: "firstName profileId",
    populate: {
      path: "profileId",
      select: "fullName profileImage",
    },
  });

  if (!user) throw new Error("User not found");

  // Récupérer l'utilisateur connecté pour vérifier ses followings
  const currentUser = await UserModel.findById(currentUserId).select(
    "followers following friendRequestsReceived friendRequestsSent"
  );

  if (!currentUser) throw new Error("Current user not found");

  // Ajouter isFollowing à chaque élément du résultat
  const followingWithStatus = user.following.map((followedUser: any) => ({
    ...followedUser.toObject(),
    isFollowing:
      currentUserId === followedUser._id.toString() ||
      currentUser.following.some(
        (f) => f.toString() === followedUser._id.toString()
      ) ||
      currentUser.followers.some(
        (f) => f.toString() === followedUser._id.toString()
      ),
    isAccepte: currentUser.friendRequestsReceived.some(
      (f) => f.toString() === followedUser._id.toString()
    ),

    isSent: currentUser.friendRequestsSent.some(
      (f) => f.toString() === followedUser._id.toString()
    ),
  }));

  return followingWithStatus;
};

export const getFollowersByUserService = async (
  userId: string,
  currentUserId: string
) => {
  // Récupérer l'utilisateur cible avec ses followings
  const user = await UserModel.findById(userId).populate({
    path: "followers",
    select: "firstName profileId",
    populate: {
      path: "profileId",
      select: "fullName profileImage",
    },
  });

  if (!user) throw new Error("User not found");

  // Récupérer l'utilisateur connecté pour vérifier ses followings
  const currentUser = await UserModel.findById(currentUserId).select(
    "followers following friendRequestsReceived friendRequestsSent"
  );

  if (!currentUser) throw new Error("Current user not found");

  // Ajouter isFollowing à chaque élément du résultat
  const followersWithStatus = user.followers.map((follower: any) => ({
    ...follower.toObject(),
    isFollowing:
      currentUserId === follower._id.toString() ||
      currentUser.followers.some(
        (f) => f.toString() === follower._id.toString()
      ) ||
      currentUser.following.some(
        (f) => f.toString() === follower._id.toString()
      ),
    isAccepte: currentUser.friendRequestsReceived.some(
      (f) => f.toString() === follower._id.toString()
    ),

    isSent: currentUser.friendRequestsSent.some(
      (f) => f.toString() === follower._id.toString()
    ),
  }));

  return followersWithStatus;
};

export const findUserByEmail = async (email: string) => {
  try {
    // 2. Vérifier si l'utilisateur existe en base
    const finduser = await UserModel.findOne({ email }).select(
      "-friends -friendRequestsReceived -friendRequestsSent -following -followers"
    );

    if (!finduser) {
      return {
        user: null,
        success: false,
        failed: true,
        message: "email not found",
      };
    }

    const code = generateCode();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.password,
      },
    });

    const mailOptions = {
      from: `"Support App" <${process.env.email}>`,
      to: email,
      subject: "Votre code de vérification",
      text: `Bonjour,\n\nVoici votre code de vérification : ${code}`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);

      // Vérifie si l'email a été accepté par le serveur SMTP
      if (info.accepted && info.accepted.includes(email)) {
        await UserModel.findByIdAndUpdate(
          { _id: finduser._id },
          { codeVerived: code }
        );
        return {
          user: finduser,
          code,
          success: true,
          failed: false,
          message: "Email envoyé avec succès",
        };
      } else {
        console.log(" Email non accepté par le serveur SMTP :", email);
        return {
          user: finduser,
          code,
          success: false,
          failed: true,
          message:
            "Échec de l’envoi de l’email : serveur SMTP a refusé la destination",
        };
      }
    } catch (error: any) {
      console.error(
        " Erreur lors de l’envoi de l’email :",
        error.message || error
      );

      return {
        user: finduser,
        code,
        success: false,
        failed: true,
        message: "Erreur lors de l’envoi de l’email",
        error: error.message || String(error),
      };
    }
  } catch (error: any) {
    console.error(" Erreur serveur :", error.message);
    throw new Error("Erreur serveur : " + (error.message || String(error)));
  }
};
