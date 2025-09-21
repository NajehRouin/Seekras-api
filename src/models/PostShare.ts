import { Schema, model, Document, Types } from "mongoose";

// Définition de l'interface pour le modèle PostShare
export interface PostShareInterface extends Document {
  userId: Types.ObjectId; // Référence à l'utilisateur
  postId: Types.ObjectId; // Référence au post
  createdAt: Date;

  // Relations
  user?: Types.ObjectId;
  post?: Types.ObjectId;
}

// Schéma de Mongoose pour PostShare
const PostShareSchema = new Schema<PostShareInterface>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Définition des virtuals pour les relations
PostShareSchema.virtual("user", {
  ref: "User", // Le modèle "User"
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

PostShareSchema.virtual("post", {
  ref: "Post", // Le modèle "Post"
  localField: "postId",
  foreignField: "_id",
  justOne: true,
});

// Création du modèle PostShare
const PostShareModel = model<PostShareInterface>("PostShare", PostShareSchema);
export type PostsShares = PostShareInterface;
export default PostShareModel;
