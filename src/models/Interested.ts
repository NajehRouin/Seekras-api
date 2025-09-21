import { Schema, model, Document, Types } from "mongoose";
import UserProfile from "./UserProfile";

interface InterestedInterface extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string | null;
  interestedImage: string | null;
  createdAt: Date;
  userProfiles?: (typeof UserProfile)[];
}

const InterestedSchema = new Schema<InterestedInterface>({
  name: { type: String, required: true },
  description: { type: String, default: null },
  interestedImage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const InterestedModel = model<InterestedInterface>(
  "Interested",
  InterestedSchema
);

export type Interested = InterestedInterface; // Export the type

export default InterestedModel;
