import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { ConversationController } from "../controllers/ConversationController";

const conversationController = new ConversationController();
const router = express.Router();

router.post(
  "/conversations",
  authenticateToken,
  conversationController.createConversation.bind(conversationController)
);

router.post(
  "/conversations/:conversationId/messages",
  authenticateToken,
  conversationController.addMessageToConversation.bind(conversationController)
);

router.put(
  "/conversations/:conversationId/read",
  authenticateToken,
  conversationController.markMessagesAsRead.bind(conversationController)
);

router.get(
  "/conversations",
  authenticateToken,
  conversationController.getUserConversations.bind(conversationController)
);

router.get(
  "/conversations/:conversationId/messages",
  authenticateToken,
  conversationController.getConversationMessages.bind(conversationController)
);

export default router;
