import { Schema, model, Document, Types } from "mongoose";

export interface PostLikeInterface extends Document {
  userId: Types.ObjectId;
  postId: Types.ObjectId;
  reaction: string;
  createdAt: Date;

  // Relations
  user?: Types.ObjectId;
  post?: Types.ObjectId;
}

const PostLikeSchema = new Schema<PostLikeInterface>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Posts", default: null },
    reaction: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for relationships
PostLikeSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

PostLikeSchema.virtual("Posts", {
  localField: "postId",
  foreignField: "_id",
  justOne: true,
});

const PostsLiksModel = model<PostLikeInterface>("PostLike", PostLikeSchema);
export type PostsLiks = PostLikeInterface;

export default PostsLiksModel;
