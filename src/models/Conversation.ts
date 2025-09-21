import { Schema, model, Document } from "mongoose";
import { Types } from "mongoose";

export interface Conversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<Conversation>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    unreadCount: { type: Map, of: Number, default: new Map<string, number>() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<Conversation>("Conversation", conversationSchema);
