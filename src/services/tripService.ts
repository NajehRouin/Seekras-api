import Trip, { ITrip } from "../models/Trip";
import { Types } from "mongoose";

// Interface pour les données d'entrée du trip
interface CreateTripInput {
  name: string;
  location: string;
  date: string;
  description: string;
  sportType: string;
  imagePath: string; // Chemin de l'image téléchargée
  teammates: string[]; // Tableau d'IDs de User
  supplies: Array<{
    name: string;
    assigned: string;
    status?: "pending" | "confirmed";
  }>;
}

// Service pour créer un nouveau trip
export const createTrip = async (input: CreateTripInput): Promise<ITrip> => {
  try {
    // Valider que teammates est un tableau
    if (!Array.isArray(input.teammates)) {
      throw new Error("Teammates must be an array");
    }

    // Valider que supplies est un tableau
    if (!Array.isArray(input.supplies)) {
      throw new Error("Supplies must be an array");
    }

    // Créer un nouveau document Trip
    const newTrip = new Trip({
      name: input.name,
      location: input.location,
      date: input.date,
      description: input.description,
      sportType: input.sportType,
      Image: input.imagePath, // Utiliser le chemin de l'image téléchargée
      teammates: input.teammates.map((id) => {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid teammate ID: ${id}`);
        }
        return new Types.ObjectId(id);
      }), // Convertir les chaînes en ObjectId
      supplies: input.supplies,
      activities: [], // Initialisé comme tableau vide par défaut
    });

    // Sauvegarder le trip dans la base de données
    await newTrip.save();

    // Populer les teammates pour renvoyer leurs données complètes
    const populatedTrip = await Trip.findById(newTrip._id)
      .populate({
        path: "teammates",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .exec();

    if (!populatedTrip) {
      throw new Error("Failed to retrieve populated trip");
    }

    return populatedTrip;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error creating trip " + error.message);
    } else {
      throw new Error("Error creating trip " + String(error));
    }
  }
};

export const getTripsByUser = async (userId: string) => {
  try {
    let findtrips = await Trip.find({ teammates: userId })
      .populate({
        path: "teammates",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .sort({
        createdAt: -1,
      })
      .exec();
    return findtrips;
  } catch (error: any) {
    throw new Error("Error fetching Trips: " + error.message || String(error));
  }
};

export const getTripsById = async (id: string) => {
  try {
    let findtrip = await Trip.findById(id)
      .populate({
        path: "teammates",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })

      .exec();
    return findtrip;
  } catch (error: any) {
    throw new Error("Error fetching Trips: " + error.message || String(error));
  }
};

export const updateSupplyStatusService = async (
  tripId: string,
  supplyId: string
) => {
  try {
    // Find the trip and update the specific supply's status
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: tripId, "supplies._id": supplyId },
      { $set: { "supplies.$.status": "confirmed" } },
      { new: true } // Return the updated document
    )
      .populate({
        path: "teammates",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .exec();

    if (!updatedTrip) {
      throw new Error("Trip or supply not found");
    }

    return updatedTrip;
  } catch (error: any) {
    throw new Error(
      "Error updating supply status: " + (error.message || String(error))
    );
  }
};

export const addActivityService = async (
  tripId: string,
  activity: { name: string; time: string; location: string }
) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        $push: {
          activities: {
            name: activity.name,
            time: activity.time,
            location: activity.location,
          },
        },
      },
      { new: true }
    )
      .populate({
        path: "teammates",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .exec();

    if (!updatedTrip) {
      throw new Error("Trip not found");
    }

    return updatedTrip;
  } catch (error: any) {
    throw new Error(
      "Error adding activity: " + (error.message || String(error))
    );
  }
};

export const AddSuppliesService = async (
  tripId: string,
  supply: { name: string; assigned: string; status: "pending" }
) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        $push: {
          supplies: {
            name: supply.name,
            assigned: supply.assigned,
            status: supply.status,
          },
        },
      },
      { new: true }
    )
      .populate({
        path: "teammates",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .exec();

    if (!updatedTrip) {
      throw new Error("Trip not found");
    }

    return updatedTrip;
  } catch (error: any) {
    throw new Error(
      "Error adding activity: " + (error.message || String(error))
    );
  }
};
