import { Request, Response } from "express";
import PostsModel, { PostInterface } from "../models/Posts";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import PostLikeModel from "../models/PostLike";
import {
  getPostsByUser,
  deletePost,
  likePost,
  getLikesForPost,
  createComment,
  deleteComment,
  getCommentsForPost,
  sharePost,
  getSharedPostsByUser,
  deleteSharedPost,
  getPostIdService,
} from "../services/postService";
import PostCommentModel from "../models/PostComment";
import { Types } from "mongoose";
import path from "path";
import UserModel from "../models/User";
//get All Post

export const getAllPostsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;
    const posts = await PostsModel.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "firstName lastName",
        populate: {
          path: "profileId",
          select: "profileImage fullName",
        },
      })
      .lean();

    // Ajouter l'information sur les likes pour chaque post
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const like = await PostLikeModel.findOne({
          userId: userId ? new Types.ObjectId(userId) : null,
          postId: post._id,
        });
        return {
          ...post,
          isLiked: !!like,
          reaction: like ? like.reaction : null,
        };
      })
    );

    res.status(200).json({ success: true, posts: postsWithLikes });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.body;
    const post = await getPostIdService(postId);
    return res.status(200).json({
      success: true,
      erro: false,
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching Post",
      success: false,
      erro: true,
      error: (error as Error).message,
    });
  }
};

//create post
export const createPostController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const {
    groupId,
    content,
    title,
    postType,
    postCategoryId,
    visibility,
    locationName,
    peopleTag,
  } = req.body;

  const files = req.files as Express.Multer.File[];
  const mediaUrls =
    files?.map((file) => `/uploads/posts/${file.filename}`) || [];
  const image =
    files && files.length > 0 ? `uploads/posts/${files[0].filename}` : null;
  // Convertir peopleTag depuis une chaîne JSON en tableau d'IDs
  let peopleTagIds: Types.ObjectId[] = [];
  if (peopleTag) {
    try {
      const parsedPeopleTag = JSON.parse(peopleTag); // Parser la chaîne JSON

      peopleTagIds = parsedPeopleTag.map(
        (_id: string) => new Types.ObjectId(_id)
      );
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid peopleTag format" });
    }
  }

  const post = await PostsModel.create({
    userId: req.user?.id?._id,
    groupId: groupId || null,
    title,
    content: content || null,
    mediaUrls,
    image: image,
    postType,
    postCategoryId: postCategoryId || null,
    visibility,
    locationName,
    peopleTag: peopleTagIds,
  });

  res.status(201).json({ success: true, post });
};

//getPosts of the current user

export const getPostOffcurrentuser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  const userId = req.user?.id?._id;

  const { offset = 0, limit = 10 } = req.query;
  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token" });
  }

  try {
    const offsetInt = parseInt(offset as string, 10);
    const limitInt = parseInt(limit as string, 10);

    const posts = await getPostsByUser(userId, offsetInt, limitInt);

    const totalPosts = await PostsModel.countDocuments({
      userId: userId,
      active: true,
    });
    return res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      erro: false,
      posts,
      totalPosts,
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

// Delete post controller
export const deletePostController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  const { postId } = req.body; // Assuming postId and userId are in the request body
  const userId = req.user?.id?._id;

  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token" });
  }
  try {
    // Call the deletePost service to delete the post
    const result = await deletePost(userId, postId);

    if (result.message === "Post not found") {
      return res.status(404).json({
        message: "Post not found. It might have been deleted already.",
      });
    }

    if (result.message === "You do not have permission to delete this post") {
      return res.status(403).json({
        message:
          "You do not have permission to delete this post. Only the post owner can delete it.",
      });
    }

    return res.status(200).json({
      message:
        "Post deleted successfully. All associated data has been removed.",
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error deleting post", error: errorMessage });
  }
};

export const checkPostLikeController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { postId } = req.params;
  const userId = req.user?.id?._id; // Récupéré depuis le middleware d'authentification

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Utilisateur non authentifié." });
  }

  try {
    const existingLike = await PostLikeModel.findOne({
      userId: userId,
      postId: new Types.ObjectId(postId),
    });

    if (existingLike) {
      return res.status(200).json({
        success: true,
        isLiked: true,
        reaction: existingLike.reaction,
      });
    } else {
      return res.status(200).json({
        success: true,
        isLiked: false,
        reaction: null,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du like:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

//Like and unlike Posts
export const likePostController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  const { postId, reaction } = req.body;
  const userId = req.user?.id?._id;
  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token" });
  }
  try {
    const result = await likePost(userId, postId, reaction);
    return res.status(200).json(result);
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error liking post", error: errorMessage });
  }
};

// Get Likes for a Post
export const getLikesController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { postId } = req.params; // Get postId from the URL parameters

  try {
    const likes = await getLikesForPost(postId);

    if ("message" in likes) {
      return res.status(404).json({ message: likes.message });
    }

    return res
      .status(200)
      .json({ message: "Likes fetched successfully", likes });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error fetching likes", error: errorMessage });
  }
};

//get All Comment By post

export const getPostComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    // Valider l'ID du post
    if (!postId || !Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    // Vérifier si le post existe
    const post = await PostsModel.findById(postId);
    if (!post || !post.active) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Récupérer les commentaires avec population de l'utilisateur
    const comments = await PostCommentModel.find({
      postId,
      active: true,
      parentCommentId: null,
    })
      .populate({
        path: "user",
        select: "firstName",
        populate: { path: "profileId", select: "profileImage" },
      }) // Ne retourne que username et image
      .populate({
        path: "replies",
        match: { active: true },
        populate: {
          path: "user",
          select: "firstName",
          populate: { path: "profileId", select: "profileImage" },
        },
      })
      .sort({ createdAt: -1 }); // Tri par date décroissante

    res.status(200).json({
      success: true,
      comments: comments.map((comment: any) => ({
        _id: comment._id,
        userId: comment.userId,
        userImage: comment.user?.profileId.profileImage,
        username: comment.user?.firstName,
        content: comment.content,
        createdAt: comment.createdAt,
        replies:
          comment.replies.map((rep: any) => ({
            _id: rep?._id,
            userId: rep.userId,
            postId: rep.postId,
            parentCommentId: rep.parentCommentId,
            userImage: rep.user?.profileId.profileImage,
            username: rep.user?.firstName,
            content: rep.content,
            createdAt: rep.createdAt,
          })) || [],
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Error fetching comments",
      error: errorMessage,
    });
  }
};

//creat comment
export const createCommentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  const { postId, parentCommentId, content } = req.body;
  const userId = req.user?.id?._id;
  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token" });
  }
  if (!postId || !content) {
    return res.status(400).json({
      message: " postId and content are required fields.",
    });
  }

  // Si c'est une réponse, vérifier que le commentaire parent existe
  if (parentCommentId) {
    const parentComment = await PostCommentModel.findById(parentCommentId);
    if (!parentComment || !parentComment.active) {
      return res
        .status(404)
        .json({ message: "Parent comment not found or inactive" });
    }
  }

  try {
    const newComment = await createComment(
      userId,
      postId,
      parentCommentId || null,
      content
    );

    // Populate user & replies de manière cohérente avec getPostComments
    const populatedComment = await PostCommentModel.findById(newComment._id)
      .populate({
        path: "user",
        select: "firstName",
        populate: { path: "profileId", select: "profileImage" },
      })
      .populate({
        path: "replies",
        match: { active: true },
        populate: {
          path: "user",
          select: "firstName",
          populate: { path: "profileId", select: "profileImage" },
        },
      });

    // Formater la réponse pour correspondre à la structure de getPostComments
    const formattedComment = {
      _id: populatedComment?._id,
      userId: populatedComment?.userId.toString(),
      userImage:
        (populatedComment?.user as any)?.profileId?.profileImage ||
        "https://via.placeholder.com/40",
      username: (populatedComment?.user as any)?.firstName || "Unknown User",
      content: populatedComment?.content,
      createdAt: populatedComment?.createdAt,
      replies: (populatedComment?.replies || []).map((reply: any) => ({
        _id: reply._id,
        userId: reply?.userId?.toString(),
        userImage:
          (reply?.user as any)?.profileId?.profileImage ||
          "https://via.placeholder.com/40",
        username: (reply?.user as any)?.firstName || "Unknown User",
        content: reply?.content,
        createdAt: reply?.createdAt,
        replies: [],
      })),
    };

    return res.status(201).json({
      message: "Comment created successfully",
      comment: formattedComment,
      newComment: {
        _id: newComment._id,
        userId: newComment.userId.toString(),
        postId: newComment.postId.toString(),
        parentCommentId: newComment.parentCommentId?.toString() || null,
        content: newComment.content,
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt,
        active: newComment.active,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      message: "Error creating comment",
      error: errorMessage,
    });
  }
};

//Delete comment
export const deleteCommentController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { commentId } = req.params; // Get the commentId from the URL parameters

  try {
    // Delete the comment
    const deletedComment = await deleteComment(commentId);

    // If comment is not found, return a 404
    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Return a success message
    return res.status(200).json({
      message: "Comment deleted successfully",
      comment: deletedComment,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error deleting comment", error: errorMessage });
  }
};

// Get Comments for a Post (Including Replies)
export const getCommentsController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { postId } = req.params; // Get postId from the URL parameters

  try {
    const comments = await getCommentsForPost(postId);

    if ("message" in comments) {
      return res.status(404).json({ message: comments.message });
    }

    return res
      .status(200)
      .json({ message: "Comments fetched successfully", comments });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error fetching comments", error: errorMessage });
  }
};

// Share a post
export const sharePostController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  const userId = req.user?.id?._id;
  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token" });
  }
  const { postId } = req.body; // Assuming userId and postId are in the request body

  try {
    const postShare = await sharePost(userId, postId);
    return res
      .status(201)
      .json({ message: "Post shared successfully", data: postShare });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error sharing post", error: errorMessage });
  }
};

// Get shared posts by a user
export const getSharedPostsController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params; // Get userId from the URL parameters

  try {
    const sharedPosts = await getSharedPostsByUser(userId);
    return res.status(200).json({
      message: "Shared posts fetched successfully",
      data: sharedPosts,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error fetching shared posts", error: errorMessage });
  }
};

// Delete a shared post
export const deleteSharedPostController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  const userId = req.user?.id?._id;
  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token" });
  }
  const { postId } = req.params; // Assuming userId and postId are in the URL parameters

  try {
    const deleted = await deleteSharedPost(userId, postId);

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Shared post not found" });
    }

    return res
      .status(200)
      .json({ message: "Shared post deleted successfully" });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return res
      .status(500)
      .json({ message: "Error deleting shared post", error: errorMessage });
  }
};

interface QueryParams {
  name?: string;
}
export const filterPostByUser = async (
  req: Request<{}, {}, {}, QueryParams>,
  res: Response
) => {
  try {
    const { name } = req.query;
    let posts: PostInterface[];
    if (name) {
      const regex = new RegExp(name, "i"); // Case-insensitive partial match
      // Find users with matching firstName or lastName
      const users = await UserModel.find({
        $or: [{ firstName: regex }, { lastName: regex }],
      }).select("_id");
      if (users.length === 0) {
        return res.json({ posts: [] }); // Return empty array if no users match
      }
      const userIds = users.map((user) => user._id);
      // Find posts by matching userIds
      posts = await PostsModel.find({
        userId: { $in: userIds },
        active: true, // Only return active posts
      })
        .populate({
          path: "user",
          select: "firstName lastName",
          populate: {
            path: "profileId",
            select: "profileImage fullName",
          },
        })
        .lean();
    } else {
      posts = await PostsModel.find({ active: true })
        .populate({
          path: "user",
          select: "firstName lastName",
          populate: {
            path: "profileId",
            select: "profileImage fullName",
          },
        })
        .lean();
    }
    res.json({ posts });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
