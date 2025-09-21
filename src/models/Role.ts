import { Schema, model, Document } from "mongoose";
import { User } from "./User";

interface RoleInterface extends Document {
  name: string;
  description: string | null;
  active: boolean;
  users?: User[];
}

const RoleSchema = new Schema<RoleInterface>({
  name: { type: String, required: true },
  description: { type: String, default: null },
  active: { type: Boolean, required: true },
});

const RoleModel = model<RoleInterface>("Role", RoleSchema);
export type Role = RoleInterface;
export default RoleModel;
