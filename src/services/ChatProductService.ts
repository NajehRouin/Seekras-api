import { Types } from "mongoose";
import ConversationModel, { ChatProduct } from "../models/ChatProduct";
import MessageModel, { Message } from "../models/messageProducts";
import { io } from "../index";

export class ChatProductService {
  async createChatProduct(
    userId1: string,
    userId2: string,
    messageContent: string,
    image: string
  ): Promise<{ conversation: ChatProduct; message: Message }> {
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
      conversationProduct: conversation._id,
      sender: new Types.ObjectId(userId1),
      receiver: new Types.ObjectId(userId2),
      message: messageContent,
      image: image,
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
      io.to(conversation._id.toString()).emit(
        "messageProduct",
        populatedMessage
      );
      io.emit("chatProductUpdate", populatedConversation);
    } else {
      console.error(
        "Erreur: populated Conversation ou populatedMessage est null"
      );
    }

    return { conversation, message: newMessage };
  }

  async addMessageToChatProduct(
    conversationId: string,
    senderId: string,
    receiverId: string,
    messageContent: string,
    image: string
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
      image: image,
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
      io.to(conversation._id.toString()).emit(
        "messageProduct",
        populatedMessage
      );
      io.emit("chatProductUpdate", populatedConversation);
    } else {
      console.error(
        "Erreur: populatedConversation ou populatedMessage est null"
      );
    }

    return newMessage;
  }

  async readMessage(
    conversationId: string,
    userId: string
  ): Promise<ChatProduct> {
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
      io.to(conversation._id.toString()).emit("messagesProductRead", {
        conversationId,
        userId,
        unreadCount: 0,
      });
      io.emit("chatProductUpdate", populatedConversation);
    } else {
      console.error("Erreur: populatedConversation est null");
    }

    return conversation;
  }

  async getConversationsByUser(userId: string): Promise<ChatProduct[]> {
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

  async getConversationByMessage(
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
      conversationProduct: new Types.ObjectId(conversationId),
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
