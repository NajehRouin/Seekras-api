import { Schema, model, Document, Types } from "mongoose";

export interface PostCommentInterface extends Document {
  userId: Types.ObjectId;
  postId: Types.ObjectId;
  parentCommentId: Types.ObjectId | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;

  // Relations (via virtuals)
  user?: Types.ObjectId;
  post?: Types.ObjectId;
  parentComment?: Types.ObjectId | null;
  replies?: Types.ObjectId[];
}

const PostCommentSchema = new Schema<PostCommentInterface>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Posts", required: true },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "PostComment",
      default: null,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: user (relation)
PostCommentSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Virtual: post (relation)
PostCommentSchema.virtual("post", {
  ref: "Posts",
  localField: "postId",
  foreignField: "_id",
  justOne: true,
});

// Virtual: parentComment (relation)
PostCommentSchema.virtual("parentComment", {
  ref: "PostComment",
  localField: "parentCommentId",
  foreignField: "_id",
  justOne: true,
});

// Virtual: replies (inversé de parentCommentId)
PostCommentSchema.virtual("replies", {
  ref: "PostComment",
  localField: "_id",
  foreignField: "parentCommentId",
});

const PostCommentModel = model<PostCommentInterface>(
  "PostComment",
  PostCommentSchema
);

export type PostsCommentsLiks = PostCommentInterface;
export default PostCommentModel;
