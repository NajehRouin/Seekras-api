import PostsModel from "../models/Posts";

import PostLikeModel from "../models/PostLike"; // adapte selon ton chemin
import PostCommentModel from "../models/PostComment"; // adapte selon ton chemin
import { Types } from "mongoose";
import PostShareModel from "../models/PostShare";

export const getPostsByUser = async (
  userId: string,
  offset: number,
  limit: number
) => {
  try {
    const posts = await PostsModel.find({
      userId: userId,
      active: true,
    })
      .sort({ createdAt: -1 })
      .populate("user") // inclut les infos de l'utilisateur
      //.populate("category") // inclut les infos de la catégorie
      // .populate("group") // inclut les infos du groupe
      .sort({ createdAt: -1 }) // tri décroissant
      .skip(offset) // pagination : ignorer X posts
      .limit(limit); // pagination : nombre de posts

    return posts;
  } catch (error: any) {
    throw new Error("Error fetching posts: " + error.message || String(error));
  }
};

export const getPostIdService = async (postId: string) => {
  try {
    const post = await PostsModel.findById(postId)
      .populate({
        path: "userId",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "peopleTag",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      });

    return post;
  } catch (error) {
    throw new Error("Error deleting post: " + (error as Error).message);
  }
};

export const deletePost = async (userId: string, postId: string) => {
  try {
    const post = await PostsModel.findById(postId);

    if (!post) {
      return { message: "Post not found" };
    }

    if (post.userId.toString() !== userId) {
      return { message: "You do not have permission to delete this post" };
    }

    // Supprimer les likes associés
    await PostLikeModel.deleteMany({ postId });

    // Supprimer les commentaires associés
    await PostCommentModel.deleteMany({ postId });

    // Supprimer le post
    await PostsModel.findByIdAndDelete(postId);

    return { message: "Post deleted successfully" };
  } catch (error) {
    throw new Error("Error deleting post: " + (error as Error).message);
  }
};

export const likePost = async (
  userId: string,
  postId: string,
  reaction: string
) => {
  try {
    const existingLike = await PostLikeModel.findOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });

    if (existingLike) {
      // Unlike: delete the like
      await PostLikeModel.findByIdAndDelete(existingLike._id);

      // Decrement likesCount on the post
      await PostsModel.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      });

      return { message: "Post unliked successfully" };
    } else {
      // Like: create a new like
      const newLike = await PostLikeModel.create({
        userId,
        postId,
        reaction,
      });

      // Increment likesCount on the post
      await PostsModel.findByIdAndUpdate(postId, {
        $inc: { likesCount: 1 },
      });

      return { message: "Post liked successfully", like: newLike };
    }
  } catch (error) {
    throw new Error(
      "Error liking/unliking post: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
};

export const getLikesForPost = async (postId: string) => {
  try {
    const likes = await PostLikeModel.find({ postId })
      .populate("userId") // Popule les infos de l'utilisateur qui a liké
      .exec();

    return likes;
  } catch (error) {
    throw new Error(
      "Error fetching likes: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
};

export const createComment = async (
  userId: string,
  postId: string,
  parentCommentId: string | null,
  content: string
) => {
  try {
    // Crée le commentaire
    const newComment = await PostCommentModel.create({
      userId,
      postId,
      parentCommentId: parentCommentId || null,
      content,
      active: true,
    });

    // Incrémente le nombre de commentaires sur le post
    await PostsModel.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });

    return newComment;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error creating comment: " + error.message);
    } else {
      throw new Error("Error creating comment: " + String(error));
    }
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    // Trouver le commentaire à supprimer
    const comment = await PostCommentModel.findById(commentId);
    if (!comment) {
      return null; // Commentaire non trouvé
    }

    // Compter les réponses associées à ce commentaire
    const childCommentsCount = await PostCommentModel.countDocuments({
      parentCommentId: commentId,
    });

    const totalCommentsToDelete = 1 + childCommentsCount;

    // Supprimer les réponses
    await PostCommentModel.deleteMany({
      parentCommentId: commentId,
    });

    // Supprimer le commentaire parent
    await PostCommentModel.findByIdAndDelete(commentId);

    // Décrémenter le nombre total de commentaires du post
    await PostsModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentsCount: -totalCommentsToDelete },
    });

    return {
      message: `Successfully deleted ${totalCommentsToDelete} comment(s)`,
    };
  } catch (error) {
    throw new Error(
      "Error deleting comment: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
};

export const getCommentsForPost = async (postId: string) => {
  try {
    const comments = await PostCommentModel.find({
      postId: new Types.ObjectId(postId),
      parentCommentId: null,
      active: true,
    })
      .populate("user") // Populate l'utilisateur du commentaire
      .populate({
        path: "replies",
        match: { active: true }, // Seulement les réponses actives
        populate: { path: "user" }, // Populate l'utilisateur de la réponse
      })
      .sort({ createdAt: -1 }); // Du plus récent au plus ancien

    return comments;
  } catch (error) {
    throw new Error(
      "Error fetching comments: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
};

// Share a post
export const sharePost = async (userId: string, postId: string) => {
  try {
    // Vérifie que le post existe
    const post = await PostsModel.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Crée une entrée de partage
    const postShare = await PostShareModel.create({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });

    // Incrémente le compteur de partages
    await PostsModel.findByIdAndUpdate(postId, {
      $inc: { sharesCount: 1 },
    });

    return postShare;
  } catch (error) {
    throw new Error(
      "Error sharing post: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
};

// Récupérer les posts partagés par un utilisateur
export const getSharedPostsByUser = async (userId: string) => {
  try {
    // Recherche des partages de posts par userId
    const sharedPosts = await PostShareModel.find({ userId })
      .populate("post") // Remplir les données du post associé
      .exec();

    return sharedPosts;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching shared posts: ${error.message}`);
    } else {
      throw new Error("Error fetching shared posts");
    }
  }
};

// Supprimer un post partagé par un utilisateur
export const deleteSharedPost = async (userId: string, postId: string) => {
  try {
    // Supprimer l'entrée de partage du post
    const deleted = await PostShareModel.deleteMany({
      userId,
      postId,
    });

    if (deleted.deletedCount > 0) {
      // Décrémenter le nombre de partages si un partage a été supprimé
      await PostsModel.updateOne(
        { _id: postId },
        { $inc: { sharesCount: -1 } } // Utilise $inc pour décrémenter
      );
    }

    return deleted;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error deleting shared post: ${error.message}`);
    } else {
      throw new Error("Error deleting shared post");
    }
  }
};
