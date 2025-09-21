import { Schema, model, Document } from "mongoose";
import { Types } from "mongoose";

export interface ChatProduct extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatProductSchema = new Schema<ChatProduct>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    messages: [{ type: Schema.Types.ObjectId, ref: "messageProducts" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "messageProducts" },
    unreadCount: { type: Map, of: Number, default: new Map<string, number>() },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<ChatProduct>("ChatProduct", ChatProductSchema);
