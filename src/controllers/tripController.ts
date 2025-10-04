import { Request, Response } from "express";
import uploadTrip from "../middlewares/uploadTrip";
import {
  addActivityService,
  AddSuppliesService,
  createTrip,
  getTripsById,
  getTripsByUser,
  updateSupplyStatusService,
} from "../services/tripService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { uploadToCloudinary } from "../utils/cloudinary";
// Contrôleur pour créer un nouveau trip avec upload d'image
export const createTripController = async (req: Request, res: Response) => {
  // Utiliser le middleware Multer pour gérer l'upload
  uploadTrip.single("image")(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: `Error uploading image: ${err.message}` });
    }

    try {
      const tripData = req.body;

      // Valider les données d'entrée
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }
      if (
        !tripData.name ||
        !tripData.location ||
        !tripData.date ||
        !tripData.description ||
        !tripData.sportType ||
        !tripData.teammates ||
        !tripData.supplies
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Parser teammates (envoyé comme JSON string depuis le frontend)
      let teammates: string[];

      try {
        teammates = JSON.parse(tripData.teammates);
        if (!Array.isArray(teammates)) {
          return res
            .status(400)
            .json({ message: "Teammates must be an array" });
        }
      } catch (error) {
        return res.status(400).json({ message: "Invalid teammates format" });
      }

      // Parser supplies (envoyé comme JSON string depuis le frontend)
      let supplies: Array<{
        name: string;
        assigned: string;
        status?: "pending" | "confirmed";
      }>;
      try {
        supplies = JSON.parse(tripData.supplies);
        if (!Array.isArray(supplies)) {
          return res.status(400).json({ message: "Supplies must be an array" });
        }
      } catch (error) {
        return res.status(400).json({ message: "Invalid supplies format" });
      }
      let imagePath = "";

      if (req.file) {
        const result = await uploadToCloudinary(req.file.path, {
          folder: "seekras/trips",
        });
        imagePath = result?.url;
      }

      // Chemin relatif de l'image pour stockage dans la base de données
      // const imagePath = `uploads/trips/${req.file.filename}`;

      // Appeler le service pour créer le trip
      const newTrip = await createTrip({
        name: tripData.name,
        location: tripData.location,
        date: tripData.date,
        description: tripData.description,
        sportType: tripData.sportType,
        imagePath,
        teammates,
        supplies,
      });

      // Renvoyer la réponse avec le trip créé
      res.status(201).json({
        message: "Trip created successfully",
        trip: {
          id: newTrip._id,
          name: newTrip.name,
          location: newTrip.location,
          date: newTrip.date,
          description: newTrip.description,
          sportType: newTrip.sportType,
          Image: newTrip.Image,
          teammates: newTrip.teammates.map((teammate: any) => ({
            id: teammate._id,
            name: teammate.firstName,
            avatar: teammate.profileId?.profileImage,
          })),
          supplies: newTrip.supplies,
          activities: newTrip.activities,
        },
        success: true,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({
        message: `Error creating trip: ${errorMessage}`,
        success: false,
      });
    }
  });
};

export const getTripByCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    const trips = await getTripsByUser(userId);

    return res.status(200).json({
      message: "Trips fetched successfully",
      success: true,
      erro: false,
      trips,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching Trips",
      success: false,
      erro: true,
      error: (error as Error).message,
    });
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const trip = await getTripsById(id);

    return res.status(200).json({
      success: true,
      erro: false,
      trip,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching Trip",
      success: false,
      erro: true,
      error: (error as Error).message,
    });
  }
};

export const updateSupplyStatus = async (req: Request, res: Response) => {
  try {
    const { tripId, supplyId } = req.body;

    // Validate input
    if (!tripId || !supplyId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "tripId and supplyId are required",
      });
    }

    const updatedTrip = await updateSupplyStatusService(tripId, supplyId);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Supply status updated to confirmed",
      trip: updatedTrip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "Error updating supply status",
      errorDetails: (error as Error).message,
    });
  }
};

export const addActivity = async (req: Request, res: Response) => {
  try {
    const { tripId, activity } = req.body;

    // Validate input
    if (
      !tripId ||
      !activity ||
      !activity.name ||
      !activity.time ||
      !activity.location
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "tripId, name, time, and location are required",
      });
    }

    const updatedTrip = await addActivityService(tripId, activity);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Activity added successfully",
      trip: updatedTrip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "Error adding activity",
      errorDetails: (error as Error).message,
    });
  }
};

export const addSupplies = async (req: Request, res: Response) => {
  try {
    const { tripId, supply } = req.body;

    // Validate input
    if (!tripId || !supply || !supply.name || !supply.assigned) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "tripId, name, name, and assigned required",
      });
    }

    const updatedTrip = await AddSuppliesService(tripId, supply);

    return res.status(200).json({
      success: true,
      error: false,
      message: "supplie added successfully",
      trip: updatedTrip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: "Error adding supplie",
      errorDetails: (error as Error).message,
    });
  }
};
