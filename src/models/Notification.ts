// models/Notification.ts
import { Schema, model, Document } from "mongoose";
import { Types } from "mongoose";

export interface Notification extends Document {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: "friend_request" | "like" | "comment" | string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<Notification>({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model<Notification>("Notification", NotificationSchema);
