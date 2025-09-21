import mongoose, { Types, Document } from "mongoose";
import ConversationModel, { Conversation } from "./models/Conversation";

interface ConversationDocument extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  unreadCount: Map<string, number>;
  messages: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

async function migrateUnreadCount() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/seekras"
    );
    console.log("Connected to MongoDB");

    const conversations = await ConversationModel.find();

    for (const conversation of conversations) {
      if (!(conversation.unreadCount instanceof Map)) {
        console.log(`Migrating conversation: ${conversation._id}`);
        const newUnreadCount = new Map<string, number>();
        conversation.participants.forEach((participant: Types.ObjectId) => {
          newUnreadCount.set(participant.toString(), 0);
        });
        conversation.unreadCount = newUnreadCount;
        await conversation.save();
        console.log(`Updated conversation: ${conversation._id}`);
      }
    }

    console.log("Migration completed");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateUnreadCount();
