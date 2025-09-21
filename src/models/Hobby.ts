import { Schema, model, Document, Types } from "mongoose";
import { UserProfile } from "./UserProfile";

interface HobbyInterface extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string | null;
  hobbieImage: string | null;
  createdAt: Date;
  userProfiles?: UserProfile[];
}

const HobbySchema = new Schema<HobbyInterface>({
  name: { type: String, required: true },
  description: { type: String, default: null },
  hobbieImage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const HobbyModel = model<HobbyInterface>("Hobby", HobbySchema);
export type Hobies = HobbyInterface; // Export the type
export default HobbyModel;
