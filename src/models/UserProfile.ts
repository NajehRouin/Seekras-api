import { Schema, model, Document, Types } from "mongoose";

import { Hobies } from "./Hobby";
import { Interested } from "./Interested";

// Interfaces pour les paramètres imbriqués
interface PrivacySettings {
  showVisitedPlaces: boolean;
  showAchievements: boolean;
  allowTagging: boolean;
  publicProfile: boolean;
}

interface NotificationSettings {
  newComments: boolean;
  newLikes: boolean;
  newFollowers: boolean;
  appUpdates: boolean;
}

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

  favoriteActivities: string[];
  privacySettings: PrivacySettings;
  notificationSettings: NotificationSettings;
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
  favoriteActivities: { type: [String], default: [] },

  privacySettings: {
    showVisitedPlaces: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
    allowTagging: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: true },
  },
  notificationSettings: {
    newComments: { type: Boolean, default: true },
    newLikes: { type: Boolean, default: true },
    newFollowers: { type: Boolean, default: true },
    appUpdates: { type: Boolean, default: false },
  },
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
UserProfileSchema.set("toJSON", { virtuals: true });
const UserProfileModel = model<UserProfileInterface>(
  "UserProfile",
  UserProfileSchema
);

export type UserProfile = UserProfileInterface;

export default UserProfileModel;
