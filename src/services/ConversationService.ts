import { Types } from "mongoose";
import ConversationModel, { Conversation } from "../models/Conversation";
import MessageModel, { Message } from "../models/Message";
import { io } from "../index";

export class ConversationService {
  async createConversation(
    userId1: string,
    userId2: string,
    messageContent: string
  ): Promise<{ conversation: Conversation; message: Message }> {
    let conversation = await ConversationModel.findOne({
      participants: {
        $all: [new Types.ObjectId(userId1), new Types.ObjectId(userId2)],
      },
    });

    let newMessage: Message & { _id: Types.ObjectId };

    if (!conversation) {
      conversation = await ConversationModel.create({
        participants: [
          new Types.ObjectId(userId1),
          new Types.ObjectId(userId2),
        ],
        unreadCount: new Map<string, number>([[userId2, 1]]),
        messages: [],
        lastMessage: undefined,
      });
    } else {
      if (!(conversation.unreadCount instanceof Map)) {
        conversation.unreadCount = new Map<string, number>();
        conversation.unreadCount.set(userId2, 1);
      }
    }

    newMessage = (await MessageModel.create({
      conversationId: conversation._id,
      sender: new Types.ObjectId(userId1),
      receiver: new Types.ObjectId(userId2),
      message: messageContent,
      unreadCount: 1,
      is_read: false,
    })) as Message & { _id: Types.ObjectId };

    conversation.messages.push(newMessage._id);
    conversation.lastMessage = newMessage._id;
    const currentUnreadCount = conversation.unreadCount.get(userId2) || 0;
    conversation.unreadCount.set(userId2, currentUnreadCount + 1);
    await conversation.save();

    const populatedConversation = await ConversationModel.findById(
      conversation._id
    )
      .populate({
        path: "participants",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "lastMessage",
        select: "message createdAt",
      });

    const populatedMessage = await MessageModel.findById(newMessage._id)
      .populate({
        path: "sender",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "receiver",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      });

    if (populatedConversation && populatedMessage) {
      io.to(conversation._id.toString()).emit("newMessage", populatedMessage);
      io.emit("conversationUpdate", populatedConversation);
    } else {
      console.error(
        "Erreur: populatedConversation ou populatedMessage est null"
      );
    }

    return { conversation, message: newMessage };
  }

  async addMessageToConversation(
    conversationId: string,
    senderId: string,
    receiverId: string,
    messageContent: string
  ): Promise<Message> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation non trouvée");
    }

    if (
      !conversation.participants.includes(new Types.ObjectId(senderId)) ||
      !conversation.participants.includes(new Types.ObjectId(receiverId))
    ) {
      throw new Error("Accès non autorisé à la conversation");
    }

    const newMessage = (await MessageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(receiverId),
      message: messageContent,
      unreadCount: 1,
      is_read: false,
    })) as Message & { _id: Types.ObjectId };

    conversation.messages.push(newMessage._id);
    conversation.lastMessage = newMessage._id;
    const currentUnreadCount = conversation.unreadCount.get(receiverId) || 0;
    conversation.unreadCount.set(receiverId, currentUnreadCount + 1);
    await conversation.save();

    const populatedConversation = await ConversationModel.findById(
      conversation._id
    )
      .populate({
        path: "participants",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "lastMessage",
        select: "message createdAt",
      });

    const populatedMessage = await MessageModel.findById(newMessage._id)
      .populate({
        path: "sender",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "receiver",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      });

    if (populatedConversation && populatedMessage) {
      io.to(conversation._id.toString()).emit("newMessage", populatedMessage);
      io.emit("conversationUpdate", populatedConversation);
    } else {
      console.error(
        "Erreur: populatedConversation ou populatedMessage est null"
      );
    }

    return newMessage;
  }

  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<Conversation> {
    const conversation = await ConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      participants: new Types.ObjectId(userId),
    });

    if (!conversation) {
      throw new Error("Conversation non trouvée ou accès non autorisé");
    }

    // Marquer tous les messages non lus comme lus pour l'utilisateur
    await MessageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        receiver: new Types.ObjectId(userId),
        is_read: false,
      },
      { $set: { is_read: true, unreadCount: 0 } }
    );

    // Réinitialiser unreadCount pour l'utilisateur
    if (conversation.unreadCount instanceof Map) {
      conversation.unreadCount.set(userId, 0);
      await conversation.save();
    }

    const populatedConversation = await ConversationModel.findById(
      conversation._id
    )
      .populate({
        path: "participants",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "lastMessage",
        select: "message createdAt",
      });

    if (populatedConversation) {
      io.to(conversation._id.toString()).emit("messagesRead", {
        conversationId,
        userId,
        unreadCount: 0,
      });
      io.emit("conversationUpdate", populatedConversation);
    } else {
      console.error("Erreur: populatedConversation est null");
    }

    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const conversations = await ConversationModel.find({
      participants: new Types.ObjectId(userId),
    })
      .populate({
        path: "participants",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "lastMessage",
        select: "message createdAt",
      })
      .sort({ updatedAt: -1 });

    return conversations;
  }

  async getConversationMessages(
    conversationId: string,
    userId: string
  ): Promise<Message[]> {
    const conversation = await ConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      participants: new Types.ObjectId(userId),
    });

    if (!conversation) {
      throw new Error("Conversation non trouvée ou accès non autorisé");
    }

    const messages = await MessageModel.find({
      conversationId: new Types.ObjectId(conversationId),
    })
      .populate({
        path: "sender",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "receiver",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .sort({ createdAt: 1 });

    return messages;
  }
}
