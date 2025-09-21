// src/models/Product.ts

import mongoose, { model, Schema, Document } from "mongoose";
import { Types } from "mongoose";

// Interface du document (avec les champs + _id)
export interface IProduct extends Document {
  userId: Types.ObjectId;
  title: string;
  price: number;
  image: string; // URL ou chemin vers l'image principale
  location: string;
  category: string;
  description: string;
  condition: string;
  listingType: string;
  views: number;
  additionalImages: string[]; // Tableau d'URLs ou chemins des images supplémentaires
  postedTime: Date;
  status: string;
  likedBy: mongoose.Types.ObjectId[];
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Si tu as un modèle User
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    listingType: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    postedTime: {
      type: Date,
      default: () => new Date(),
    },

    status: {
      type: String,
      enum: ["active", "sold", "reserved"],
      default: "active",
    },

    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

const productModel = model<IProduct>("Product", ProductSchema);
export type Product = IProduct;
export default productModel;
