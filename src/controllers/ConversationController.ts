import { Request, Response } from "express";
import { ConversationService } from "../services/ConversationService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  async createConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId, message } = req.body;
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
        await this.conversationService.createConversation(
          authUserId,
          userId,
          message
        );
      res.status(201).json({ conversation, message: newMessage });
    } catch (error: any) {
      res.status(500).json({
        message:
          error.message || "Erreur lors de la création de la conversation",
      });
    }
  }

  async addMessageToConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { message, receiverId } = req.body;
      const authUserId = req.user?.id?._id;

      if (!authUserId || !receiverId || !message || !conversationId) {
        res.status(400).json({
          message:
            "Les IDs des utilisateurs, le contenu du message et l'ID de la conversation sont requis",
        });
        return;
      }

      const newMessage =
        await this.conversationService.addMessageToConversation(
          conversationId,
          authUserId,
          receiverId,
          message
        );
      res.status(201).json(newMessage);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Erreur lors de l'envoi du message",
      });
    }
  }

  async markMessagesAsRead(
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

      const conversation = await this.conversationService.markMessagesAsRead(
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

  async getUserConversations(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const authUserId = req.user?.id?._id;

      if (!authUserId) {
        res.status(401).json({ message: "Utilisateur non authentifié" });
        return;
      }

      const conversations = await this.conversationService.getUserConversations(
        authUserId
      );
      res.status(200).json(conversations);
    } catch (error: any) {
      res.status(500).json({
        message:
          error.message || "Erreur lors de la récupération des conversations",
      });
    }
  }

  async getConversationMessages(
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

      const messages = await this.conversationService.getConversationMessages(
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
