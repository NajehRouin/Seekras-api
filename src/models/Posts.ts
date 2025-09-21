import { Schema, model, Document, Types } from "mongoose";

export interface PostInterface extends Document {
  userId: Types.ObjectId;
  groupId: Types.ObjectId | null;
  title: string;
  content: string | null;
  mediaUrls: string[];
  image: string | null;
  postType: string;
  postCategoryId: Types.ObjectId | null;
  visibility: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  locationName: string | null;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  peopleTag: Types.ObjectId[];

  // Relations (virtuals)
  user?: Types.ObjectId;
  group?: Types.ObjectId;
  category?: Types.ObjectId | null;
  likes?: Types.ObjectId[];
  comments?: Types.ObjectId[];
  shares?: Types.ObjectId[];
  peopleTagUsers?: Types.ObjectId[]; // Virtual pour les utilisateurs taggés
}

const PostSchema = new Schema<PostInterface>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    title: { type: String, default: null },
    content: { type: String, default: null },
    image: { type: String, default: null },
    mediaUrls: { type: [String], default: [] },
    postType: { type: String, required: true },
    postCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "PostCategory",
      default: null,
    },
    visibility: { type: String, default: "public" },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    locationName: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    peopleTag: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // Nouveau champ
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals pour les relations
PostSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

PostSchema.virtual("group", {
  ref: "Group",
  localField: "groupId",
  foreignField: "_id",
  justOne: true,
});

PostSchema.virtual("category", {
  ref: "PostCategory",
  localField: "postCategoryId",
  foreignField: "_id",
  justOne: true,
});

PostSchema.virtual("likes", {
  ref: "PostLike",
  localField: "likes",
  foreignField: "_id",
});

PostSchema.virtual("comments", {
  ref: "PostComment",
  localField: "comments",
  foreignField: "_id",
});

PostSchema.virtual("shares", {
  ref: "PostShare",
  localField: "_id",
  foreignField: "postId",
});

PostSchema.virtual("peopleTagUsers", {
  ref: "User",
  localField: "peopleTag",
  foreignField: "_id",
  justOne: false, // Pas justOne car c'est un tableau
});

const PostsModel = model<PostInterface>("Posts", PostSchema);
export type Posts = PostInterface;

export default PostsModel;
