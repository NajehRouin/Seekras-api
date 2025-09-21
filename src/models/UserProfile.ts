import { Schema, model, Document, Types } from "mongoose";

import { Hobies } from "./Hobby";
import { Interested } from "./Interested";

interface UserProfileInterface extends Document {
  fullName: string;
  city: string | null;
  birthday: Date | null;
  location: string | null;
  phoneNumber: string;
  gender: string | null;
  profileImage: string | null;
  coverImage: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  notificationToken: string | null;
  profileCompletionPercentage: number;
  points: number;
  followRequestEnabled: boolean;
  pushNotificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoriesId: string | null;
  badgesId: string | null;
  notificationsId: string | null;
  status: string | null;
  hobbiesId: Types.ObjectId[];
  interestedId: Types.ObjectId[];
  hobbies?: Hobies[];
  intersteds?: Interested[];
  profilPublic: boolean;
}

const UserProfileSchema = new Schema<UserProfileInterface>({
  fullName: { type: String, required: true },
  city: { type: String, default: null },
  birthday: { type: Date, default: null },
  location: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  gender: { type: String, default: null },
  profileImage: { type: String, default: null },
  coverImage: { type: String, default: null },
  bio: { type: String, default: null },
  isOnline: { type: Boolean, required: true },
  lastSeen: { type: Date, default: null },
  notificationToken: { type: String, default: null },
  profileCompletionPercentage: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  followRequestEnabled: { type: Boolean, default: true },
  pushNotificationEnabled: { type: Boolean, default: true },
  profilPublic: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  categoriesId: { type: String, default: null },
  badgesId: { type: String, default: null },
  notificationsId: { type: String, default: null },
  status: { type: String, default: null },
  hobbiesId: [{ type: Schema.Types.ObjectId, ref: "Hobby", required: true }],
  interestedId: [
    { type: Schema.Types.ObjectId, ref: "Interested", required: true },
  ],
});

// Define relations using references (ref)
UserProfileSchema.virtual("hobbies", {
  ref: "Hobby", // Name of the Hobby model
  localField: "hobbiesId",
  foreignField: "_id",
});

UserProfileSchema.virtual("intersteds", {
  ref: "Interested", // Name of the Interested model
  localField: "interestedId",
  foreignField: "_id",
});

const UserProfileModel = model<UserProfileInterface>(
  "UserProfile",
  UserProfileSchema
);

export type UserProfile = UserProfileInterface;

export default UserProfileModel;
