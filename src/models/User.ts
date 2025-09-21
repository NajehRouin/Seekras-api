import mongoose, { Schema, model, Document, Types } from "mongoose";
import { UserProfile } from "./UserProfile";
import { Role } from "./Role";

interface UserInterface extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  profileId: Types.ObjectId;
  roleId: Types.ObjectId;
  authProviderId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  userOtp: string | null;
  userOtpExpiration: Date | null;

  profile?: UserProfile;
  role?: Role;
  codeVerived: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  friends: mongoose.Types.ObjectId[];
  friendRequestsSent: mongoose.Types.ObjectId[];
  friendRequestsReceived: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<UserInterface>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profileId: {
    type: Schema.Types.ObjectId,
    ref: "UserProfile",
    required: true,
  },
  roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
  authProviderId: { type: String, default: null },
  active: { type: Boolean, required: true },

  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  friendRequestsSent: [{ type: Schema.Types.ObjectId, ref: "User" }],
  friendRequestsReceived: [{ type: Schema.Types.ObjectId, ref: "User" }],
  codeVerived: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userOtp: { type: String, default: null },
  userOtpExpiration: { type: Date, default: null },
});

const UserModel = model<UserInterface>("User", UserSchema);
export type User = UserInterface;
export default UserModel;
