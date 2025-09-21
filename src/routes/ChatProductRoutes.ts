import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { ChatProductController } from "../controllers/ChatProductController";

const chatProductController = new ChatProductController();
const router = express.Router();

router.post(
  "/chatproduct",
  authenticateToken,
  chatProductController.createProductChat.bind(chatProductController)
);

router.post(
  "/chatproduct/:conversationId/messages",
  authenticateToken,
  chatProductController.addMessageChatProduct.bind(chatProductController)
);

router.put(
  "/chatproduct/:conversationId/read",
  authenticateToken,
  chatProductController.readMessageProduct.bind(chatProductController)
);

router.get(
  "/chatproduct",
  authenticateToken,
  chatProductController.getChatProduct.bind(chatProductController)
);

router.get(
  "/chatproduct/:conversationId/messages",
  authenticateToken,
  chatProductController.getChatMessages.bind(chatProductController)
);

export default router;
