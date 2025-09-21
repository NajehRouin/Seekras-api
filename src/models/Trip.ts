import { Schema, model, Document, Types } from "mongoose";

// Interface pour les sous-documents supplies
export interface ISupply {
  name: string;
  assigned: string;
  status: "pending" | "confirmed";
}

// Interface pour les sous-documents activities
export interface IActivity {
  name: string;
  time: string;
  location: string;
}

// Interface pour le document Trip
export interface ITrip extends Document {
  name: string;
  location: string;
  date: string;
  description: string;
  sportType: string;
  Image: string;
  teammates: Types.ObjectId[];
  supplies: ISupply[];
  activities: IActivity[];
}

// Schéma Mongoose
const TripSchema = new Schema<ITrip>(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    sportType: {
      type: String,
      required: true,
    },
    Image: {
      type: String,
      required: true,
    },
    teammates: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    supplies: [
      {
        name: {
          type: String,
          required: true,
        },
        assigned: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "confirmed"],
          default: "pending",
        },
      },
    ],
    activities: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          time: {
            type: String,
            required: true,
          },
          location: {
            type: String,
            required: true,
          },
        },
      ],
      default: [], // Tableau vide par défaut
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  }
);

// Création du modèle
const TripModel = model<ITrip>("Trip", TripSchema);
export type Trip = ITrip;
export default TripModel;
