import { Schema, model, Document } from "mongoose";
import { Types } from "mongoose";

export interface Message extends Document {
  _id: Types.ObjectId;
  conversationgroupe: Types.ObjectId;
  sender: Types.ObjectId;
  message: string;
  unreadCount: number;
  is_read: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<Message>(
  {
    conversationgroupe: {
      type: Schema.Types.ObjectId,
      ref: "chatGroup",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },

    message: { type: String },
    unreadCount: { type: Number, default: 1 },
    is_read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<Message>("Messagegroupe", messageSchema);
