import { Schema, model, Document, Types } from "mongoose";

export interface GroupInterface extends Document {
  name: string;
  description: string | null;
  groupCategory: string | null;
  creatorId: Types.ObjectId;
  members: Types.ObjectId[]; // Tableau de références User
  privacy: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;

  // Relations (virtuals)
  creator?: Types.ObjectId;
  posts?: Types.ObjectId[];
}

const GroupSchema = new Schema<GroupInterface>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    groupCategory: { type: String, default: null },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // Tableau de User IDs
    privacy: { type: String, enum: ["public", "private"], default: "public" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GroupSchema.virtual("creator", {
  ref: "User",
  localField: "creatorId",
  foreignField: "_id",
  justOne: true,
});

GroupSchema.virtual("posts", {
  ref: "Posts",
  localField: "_id",
  foreignField: "groupId",
});

const GroupModel = model<GroupInterface>("Group", GroupSchema);
export type Group = GroupInterface;
export default GroupModel;
