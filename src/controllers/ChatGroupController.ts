import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { ChatGroupService } from "../services/ChatGroupService";
import mongoose from "mongoose";

const chatGroupService = new ChatGroupService();

const uploadGroupe = require("../middlewares/uploadGroup").default;

export const uploadGroupeImages = uploadGroupe.single("image");

export const createChatGroupe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const creatorId = req.user?.id?._id;

    // Parse members if sent as a string (common in multipart/form-data)
    let members = req.body.members;
    if (typeof members === "string") {
      try {
        members = JSON.parse(members);
      } catch (error) {
        return res.status(400).json({
          error: "Invalid members format",
          details: "Members must be a valid JSON array",
        });
      }
    }
    // Validate members array
    if (
      members &&
      (!Array.isArray(members) ||
        !members.every((id) => mongoose.Types.ObjectId.isValid(id)))
    ) {
      return res.status(400).json({
        error: "Invalid members",
        details: "Members must be an array of valid ObjectIds",
      });
    }

    const groupData = {
      ...req.body,
      members: members || [],
    };

    const groupe = await chatGroupService.createChatGroup(
      creatorId,
      groupData,
      req.file as Express.Multer.File
    );
    res.status(201).json({ success: true, groupe });
  } catch (error) {
    res
      .status(500)
      .json({ err: "Erreur lors de la création du groupe", error });
  }
};

export const getAllGroupe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    const groupes = await chatGroupService.getAllChatGroups(userId);

    return res.status(200).json({
      message: "groupe fetched successfully",
      success: true,
      erro: false,
      groupes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching groupe",
      success: false,
      erro: true,
      error: (error as Error).message,
    });
  }
};

export const getConversationGroupe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupeId } = req.params;
    const authUserId = req.user?.id?._id;
    if (!authUserId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    if (!groupeId) {
      res.status(400).json({ message: "L'ID de la groupeId est requis" });
      return;
    }

    const messages = await chatGroupService.getConverstionGroupe(
      groupeId,
      authUserId
    );
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur lors de la récupération des messages",
    });
  }
};

export const addMessageGroupe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { groupeId } = req.params;
    const { message } = req.body;
    const authUserId = req.user?.id?._id;

    if (!authUserId || !message || !groupeId) {
      res.status(400).json({
        message:
          "Les IDs des utilisateurs, le contenu du message et l'ID de la groupe sont requis",
      });
      return;
    }

    const newMessage = await chatGroupService.sentMessageGroupe(
      groupeId,
      authUserId,
      message
    );
    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur lors de l'envoi du message",
    });
  }
};

export const detailsgroupe = async (req: Request, res: Response) => {
  try {
    const { groupeId } = req.params;
    if (!groupeId) {
      res.status(400).json({
        message: "l'ID de la groupe sont requis",
      });
      return;
    }
    const groupe = await chatGroupService.infoGroupe(groupeId);
    res.status(201).json(groupe);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur lors de afficher detail groupe ",
    });
  }
};

export const deleteMembre = async (req: Request, res: Response) => {
  try {
    const { groupeId } = req.params;
    const { userId } = req.body;
    if (!groupeId) {
      res.status(400).json({
        message: "l'ID de la groupe sont requis",
      });
      return;
    }
    const groupe = await chatGroupService.removeMember(groupeId, userId);
    res.status(201).json(groupe);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur lors de afficher detail groupe ",
    });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { groupeId } = req.params;
    if (!groupeId) {
      res.status(400).json({
        message: "l'ID de la groupe sont requis",
      });
      return;
    }

    const member = await chatGroupService.listUsers(groupeId);
    res.status(201).json(member);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur lors de afficher detail groupe ",
    });
  }
};

//addMember
export const addMemberToGroupe = async (req: Request, res: Response) => {
  try {
    const { groupeId } = req.params;
    const { userId } = req.body;
    if (!groupeId) {
      res.status(400).json({
        message: "l'ID de la groupe sont requis",
      });
      return;
    }

    const member = await chatGroupService.addMember(groupeId, userId);
    res.status(201).json(member);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur lors de l'ajouter user ",
    });
  }
};

export const updateGroupe = async (req: Request, res: Response) => {
  try {
    const { groupeId } = req.params;
    if (!groupeId) {
      res.status(400).json({
        message: "l'ID de la groupe sont requis",
      });
      return;
    }
    const groupData = {
      ...req.body,
    };

    const groupe = await chatGroupService.updateChatGroup(
      groupeId,
      groupData,
      req.file as Express.Multer.File
    );
    res.status(201).json({ success: true, groupe });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Erreur lors modification groupe ",
    });
  }
};
