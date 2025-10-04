// src/utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fonction utilitaire pour téléverser une image
export const uploadToCloudinary = async (
  filePath: string,
  options: { folder?: string } = {}
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      ...options,
    });
    return result;
  } catch (error) {
    throw new Error(`Erreur lors du téléversement vers Cloudinary : ${error}`);
  }
};

// Fonction utilitaire pour téléverser plusieurs images
export const uploadMultipleToCloudinary = async (
  filePaths: string[],
  options: { folder?: string } = {}
) => {
  try {
    const uploadPromises = filePaths.map(async (filePath) => {
      const result = await cloudinary.uploader.upload(filePath, {
        ...options,
      });
      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw new Error(
      `Erreur lors du téléversement multiple vers Cloudinary : ${error}`
    );
  }
};

// Exportation de l'instance cloudinary pour une utilisation directe si nécessaire
export { cloudinary };
