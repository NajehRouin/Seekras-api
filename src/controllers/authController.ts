import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/User";
import UserProfileModel from "../models/UserProfile";
import RoleModel from "../models/Role";
import { UserProfile } from "../models/UserProfile";
import HobbyModel, { Hobies } from "../models/Hobby";
import InterestedModel from "../models/Interested";
import { Types } from "mongoose";
import { generateToken } from "../utils/jwtUtils";

export const register = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      fullName,
      email,
      password,
      phoneNumber,
      status,
      profileImage,
      day,
      month,
      year,
      gender,
      hobbies,
      interests,
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "L'utilisateur existe déjà" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Récupérer ou créer le rôle par défaut
    let role = await RoleModel.findOne({ name: "User" });
    if (!role) {
      role = new RoleModel({
        name: "User",
        description: "Utilisateur standard",
        active: true,
      });
      await role.save();
    }

    // Formater la date de naissance
    const birthday = new Date(`${year}-${month}-${day}`);

    // Supposons que `hobbies` est bien typé comme `Array<{ name: string; description?: string; image?: string }>`
    let hobbyIds: string[] = [];

    if (Array.isArray(hobbies) && hobbies.length > 0) {
      for (const hobbyItem of hobbies) {
        // Chercher un hobby existant avec le même nom
        const existingHobby = await HobbyModel.findOne({
          name: hobbyItem.name,
        });

        if (existingHobby) {
          // Si trouvé, ajouter son _id à la liste
          hobbyIds.push(existingHobby._id.toString());
        } else {
          // Sinon, créer un nouveau hobby
          const createdHobby = new HobbyModel({
            name: hobbyItem.name,
            description: hobbyItem?.description || null,
            hobbieImage: hobbyItem?.image || null,
            createdAt: new Date(),
          });

          await createdHobby.save();

          hobbyIds.push(createdHobby._id.toString());
        }
      }
    }

    let interestIds: string[] = [];

    if (Array.isArray(interests) && interests.length > 0) {
      for (const interestItem of interests) {
        // Vérifier si l'intérêt existe déjà par nom (insensible à la casse si tu veux)
        const existingInterest = await InterestedModel.findOne({
          name: interestItem.name,
        });

        if (existingInterest) {
          // Si trouvé, ajouter son _id
          interestIds.push(existingInterest._id.toString());
        } else {
          // Sinon, créer un nouvel intérêt
          const createdInterest = await InterestedModel.create({
            name: interestItem.name,
            description: interestItem?.description || null,
            interestedImage: interestItem?.image || null,
            createdAt: new Date(),
          });

          interestIds.push(createdInterest._id.toString());
        }
      }
    }

    // Créer un profil utilisateur
    const userProfile = new UserProfileModel({
      fullName: fullName,
      phoneNumber,
      city: null,
      birthday,
      location: null,
      gender,
      profileImage,
      coverImage: null,
      bio: null,
      isOnline: true,
      lastSeen: null,
      notificationToken: null,
      profileCompletionPercentage: 0,
      points: 0,
      followRequestEnabled: true,
      pushNotificationEnabled: true,
      status,
      hobbiesId: hobbyIds,
      interestedId: interestIds,
      createdAt: new Date(),
      updatedAt: new Date(),
      profilPublic: true,
    });

    await userProfile.save();

    // Créer un nouvel utilisateur
    const newUser = new UserModel({
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
      roleId: role._id,
      authProviderId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileId: userProfile._id,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "Utilisateur enregistré avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    return res
      .status(500)
      .json({ message: "Erreur du serveur", success: false, error: true });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await UserModel.findOne({ email }).populate({
      path: "profileId",
      populate: [
        {
          path: "hobbiesId",
          model: "Hobby",
        },
        {
          path: "interestedId",
          model: "Interested",
        },
      ],
    });
    if (!user) {
      return res.status(400).json({ message: "email incorrect" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    const token = generateToken({
      id: user,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur du serveur" });
  }
};

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await UserModel.findOne({ email }).populate({
      path: "profileId",
      populate: [
        {
          path: "hobbiesId",
          model: "Hobby",
        },
        {
          path: "interestedId",
          model: "Interested",
        },
      ],
    });
    if (!user) {
      return res.status(400).json({ message: "email n'existe pas" });
    }

    const token = generateToken({
      id: user,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur du serveur" });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { password, email } = req.body;

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    let findUser = await UserModel.findOneAndUpdate(
      { email: email },
      { passwordHash: hashedPassword }
    );
    return res.status(201).json({
      success: true,
      error: false,
      message: "mot de pass modifier avec succès",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur du serveur", success: false, error: true });
  }
};
