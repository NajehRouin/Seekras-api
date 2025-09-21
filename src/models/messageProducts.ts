import { Schema, model, Document } from "mongoose";
import { Types } from "mongoose";

export interface Message extends Document {
  _id: Types.ObjectId;
  conversationProduct: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message: string;
  image?: string;
  unreadCount: number;
  is_read: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<Message>(
  {
    conversationProduct: {
      type: Schema.Types.ObjectId,
      ref: "ChatProduct",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String },
    image: { type: String },
    unreadCount: { type: Number, default: 1 },
    is_read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<Message>("messageProducts", messageSchema);
