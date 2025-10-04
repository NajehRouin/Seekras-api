import mongoose, { Types } from "mongoose";
import ChatGroup, { GroupInterface } from "../models/ChatGroup";
import fs from "fs";
import path from "path";
import MessageGroupe, { Message } from "../models/MessageGroupe";
import UserModel from "../models/User";
import { io } from "../index";
import { uploadToCloudinary } from "../utils/cloudinary";
export class ChatGroupService {
  // Create a new chat group with image upload
  async createChatGroup(
    creatorId: string,
    data: Partial<GroupInterface>,
    file?: Express.Multer.File
  ): Promise<GroupInterface> {
    let imagePath = "";

    if (file) {
      const result = await uploadToCloudinary(file.path, {
        folder: "seekras/groupe",
      });
      imagePath = result?.url;
    }

    // Parse and validate members
    let members: string[] = [];
    if (data.members) {
      members = Array.isArray(data.members)
        ? data.members
        : typeof data.members === "string"
        ? JSON.parse(data.members)
        : [];
      if (!members.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error("Members must be an array of valid ObjectIds");
      }
    }

    // Add creatorId to members array if not already present
    if (!members.includes(creatorId)) {
      members.push(creatorId);
    }

    const initialMessage = new MessageGroupe({
      conversationgroupe: new mongoose.Types.ObjectId(), // Temporary ID, will update later
      sender: creatorId,
      message: `Group ${data.name} created`,
      unreadCount: 1,
      is_read: false,
    });

    await initialMessage.save();

    const chatGroupData = new ChatGroup({
      ...data,
      creatorId,
      image: imagePath || data.image,
      members,
      messages: [initialMessage._id],
      lastMessage: initialMessage._id,
    });

    // Update the message with the correct conversationgroupe ID
    initialMessage.conversationgroupe = chatGroupData._id;
    await initialMessage.save();

    return await chatGroupData.save();
  }

  // Get all chat groups
  async getAllChatGroups(userId: string): Promise<GroupInterface[]> {
    try {
      let findsGroupe = await ChatGroup.find({ members: userId })
        .populate({
          path: "creatorId",
          select: "firstName profileId",
          populate: {
            path: "profileId",
            select: "fullName profileImage",
          },
        })
        .populate({
          path: "members",
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
        .exec();
      return findsGroupe;
    } catch (error: any) {
      throw new Error(`Failed to fetch chat groups: ${error.message}`);
    }
  }

  async getConverstionGroupe(
    groupeId: string,
    userId: string
  ): Promise<Message[]> {
    const findGroupe = await ChatGroup.findOne({
      _id: new Types.ObjectId(groupeId),
    });

    if (!findGroupe) {
      throw new Error("findGroupe non trouvée ou accès non autorisé");
    }

    const messages = await MessageGroupe.find({
      conversationgroupe: new Types.ObjectId(groupeId),
    })
      .populate({
        path: "sender",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .sort({ createdAt: 1 });
    return messages;
  }

  // Update a chat group
  async updateChatGroup(
    groupeId: string,
    data: Partial<GroupInterface>,
    file?: Express.Multer.File
  ): Promise<GroupInterface | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(groupeId)) {
        throw new Error("Invalid group ID");
      }

      let imagePath = data.image;

      if (file) {
        const result = await uploadToCloudinary(file.path, {
          folder: "seekras/groupe",
        });
        imagePath = result?.url;
      }

      const updatedData = { ...data, image: imagePath };
      return await ChatGroup.findByIdAndUpdate(groupeId, updatedData, {
        new: true,
        runValidators: true,
      })
        .populate({
          path: "creatorId",
          select: "firstName profileId",
          populate: {
            path: "profileId",
            select: "fullName profileImage",
          },
        })
        .populate({
          path: "members",
          select: "firstName profileId",
          populate: {
            path: "profileId",
            select: "fullName profileImage",
          },
        })

        .exec();
    } catch (error) {
      throw new Error(`Failed to update chat group: ${error}`);
    }
  }

  // Delete a chat group
  async deleteChatGroup(id: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid group ID");
      }

      const group = await ChatGroup.findById(id);
      if (!group) {
        throw new Error("Chat group not found");
      }

      await ChatGroup.findByIdAndDelete(id).exec();
    } catch (error) {
      throw new Error(`Failed to delete chat group: ${error}`);
    }
  }

  // Add member to chat group
  async addMember(
    groupId: string,
    userId: string
  ): Promise<GroupInterface | null> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(groupId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error("Invalid group or user ID");
      }

      return await ChatGroup.findByIdAndUpdate(
        groupId,
        { $addToSet: { members: userId } },
        { new: true }
      )
        .populate({
          path: "creatorId",
          select: "firstName profileId",
          populate: {
            path: "profileId",
            select: "fullName profileImage",
          },
        })
        .populate({
          path: "members",
          select: "firstName profileId",
          populate: {
            path: "profileId",
            select: "fullName profileImage",
          },
        })
        .select("-messages -lastMessage")
        .exec();
    } catch (error) {
      throw new Error(`Failed to add member: ${error}`);
    }
  }

  // Remove member from chat group
  async removeMember(
    groupId: string,
    userId: string
  ): Promise<GroupInterface | null> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(groupId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error("Invalid group or user ID");
      }

      return await ChatGroup.findByIdAndUpdate(
        groupId,
        { $pull: { members: userId } },
        { new: true }
      )
        .populate({
          path: "creatorId",
          select: "firstName profileId",
          populate: {
            path: "profileId",
            select: "fullName profileImage",
          },
        })
        .populate({
          path: "members",
          select: "firstName profileId",
          populate: {
            path: "profileId",
            select: "fullName profileImage",
          },
        })
        .exec();
    } catch (error) {
      throw new Error(`Failed to remove member: ${error}`);
    }
  }

  async sentMessageGroupe(
    groupeId: string,
    senderId: string,
    messageContent: string
  ): Promise<Message> {
    const findGroupe = await ChatGroup.findById(groupeId);
    if (!findGroupe) {
      throw new Error("Groupe non trouvée ou accès non autorisé");
    }

    const newMessage = (await MessageGroupe.create({
      conversationgroupe: new Types.ObjectId(groupeId),
      sender: new Types.ObjectId(senderId),
      message: messageContent,
      unreadCount: 1,
      is_read: false,
    })) as Message & { _id: Types.ObjectId };

    findGroupe.messages.push(newMessage._id);
    findGroupe.lastMessage = newMessage._id;

    await findGroupe.save();

    const populatedConversation = await ChatGroup.findById(findGroupe._id)
      .populate({
        path: "members",
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

    const populatedMessage = await MessageGroupe.findById(
      newMessage._id
    ).populate({
      path: "sender",
      select: "firstName profileId",
      populate: {
        path: "profileId",
        select: "fullName profileImage",
      },
    });

    if (populatedConversation && populatedMessage) {
      io.to(findGroupe._id.toString()).emit("messageGroupe", populatedMessage);
      io.emit("groupeUpdate", populatedConversation);
    } else {
      console.error(
        "Erreur: populatedConversation ou populatedMessage est null"
      );
    }

    return newMessage;
  }

  async infoGroupe(groupeId: string): Promise<GroupInterface | null> {
    if (!mongoose.Types.ObjectId.isValid(groupeId)) {
      throw new Error("Invalid group ID");
    }
    return await ChatGroup.findById(groupeId)
      .populate({
        path: "creatorId",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .populate({
        path: "members",
        select: "firstName profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      })
      .select("-messages -lastMessage")
      .exec();
  }

  async listUsers(groupeId: string): Promise<any[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(groupeId)) {
        throw new Error("Invalid group ID");
      }

      // 1. Trouver le groupe pour récupérer les membres actuels
      const group = await ChatGroup.findById(groupeId).select("members").exec();
      if (!group) {
        throw new Error("Group not found");
      }

      // 2. Extraire les IDs des membres actuels
      const memberIds = group.members.map((id) => id.toString());

      // 3. Trouver tous les utilisateurs SAUF ceux dans memberIds
      const Members = await UserModel.find({
        _id: { $nin: memberIds },
      })
        .select("firstName profileId")
        .populate({
          path: "profileId",
          select: "fullName profileImage",
        })
        .exec();

      return Members;
    } catch (error: any) {
      throw new Error(`Failed to fetch non-members: ${error.message}`);
    }
  }
}
