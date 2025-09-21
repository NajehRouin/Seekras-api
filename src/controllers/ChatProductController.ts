import { Request, Response } from "express";

import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { ChatProductService } from "../services/ChatProductService";

export class ChatProductController {
  private chatProductService: ChatProductService;

  constructor() {
    this.chatProductService = new ChatProductService();
  }

  async createProductChat(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId, message, image } = req.body;
      const authUserId = req.user?.id?._id;

      if (!authUserId || !userId) {
        res.status(400).json({
          message:
            "Les IDs des utilisateurs et le contenu du message sont requis",
        });
        return;
      }

      if (authUserId === userId) {
        res.status(400).json({
          message: "Impossible de créer une conversation avec soi-même",
        });
        return;
      }

      const { conversation, message: newMessage } =
        await this.chatProductService.createChatProduct(
          authUserId,
          userId,
          message,
          image
        );
      res.status(201).json({ conversation, message: newMessage });
    } catch (error: any) {
      res.status(500).json({
        message:
          error.message || "Erreur lors de la création de la conversation",
      });
    }
  }

  async addMessageChatProduct(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { message, receiverId, image } = req.body;
      const authUserId = req.user?.id?._id;

      if (!authUserId || !receiverId || !message || !conversationId) {
        res.status(400).json({
          message:
            "Les IDs des utilisateurs, le contenu du message et l'ID de la conversation sont requis",
        });
        return;
      }

      const newMessage = await this.chatProductService.addMessageToChatProduct(
        conversationId,
        authUserId,
        receiverId,
        message,
        image
      );
      res.status(201).json(newMessage);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Erreur lors de l'envoi du message",
      });
    }
  }

  async readMessageProduct(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { conversationId } = req.params;
      const authUserId = req.user?.id?._id;

      if (!authUserId || !conversationId) {
        res.status(400).json({
          message: "L'ID de l'utilisateur ou de la conversation est requis",
        });
        return;
      }

      const conversation = await this.chatProductService.readMessage(
        conversationId,
        authUserId
      );
      res.status(200).json(conversation);
    } catch (error: any) {
      res.status(500).json({
        message:
          error.message || "Erreur lors du marquage des messages comme lus",
      });
    }
  }

  async getChatProduct(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const authUserId = req.user?.id?._id;

      if (!authUserId) {
        res.status(401).json({ message: "Utilisateur non authentifié" });
        return;
      }

      const conversations =
        await this.chatProductService.getConversationsByUser(authUserId);
      res.status(200).json(conversations);
    } catch (error: any) {
      res.status(500).json({
        message:
          error.message || "Erreur lors de la récupération des conversations",
      });
    }
  }

  async getChatMessages(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { conversationId } = req.params;
      const authUserId = req.user?.id?._id;

      if (!authUserId) {
        res.status(401).json({ message: "Utilisateur non authentifié" });
        return;
      }

      if (!conversationId) {
        res.status(400).json({ message: "L'ID de la conversation est requis" });
        return;
      }

      const messages = await this.chatProductService.getConversationByMessage(
        conversationId,
        authUserId
      );
      res.status(200).json(messages);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Erreur lors de la récupération des messages",
      });
    }
  }
}
