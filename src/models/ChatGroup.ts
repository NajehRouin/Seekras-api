import { Schema, model, Document, Types } from "mongoose";

export interface GroupInterface extends Document {
  _id: Types.ObjectId;
  name: string;
  image: string; // URL ou chemin vers l'image principale
  creatorId: Types.ObjectId;

  members: Types.ObjectId[]; // Tableau de références User
  messages: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

const ChatGroupSchema = new Schema<GroupInterface>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Si tu as un modèle User
      required: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Si tu as un modèle User
        required: true,
      },
    ],
    messages: [{ type: Schema.Types.ObjectId, ref: "Messagegroupe" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Messagegroupe" },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model<GroupInterface>("chatGroup", ChatGroupSchema);
