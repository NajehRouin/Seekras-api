import { io } from "../index"; // Importer io depuis index.ts

export const onlineUsers = new Map<string, string>(); // Map<userId, socketId>

export const addOnlineUser = (userId: string, socketId: string) => {
  onlineUsers.set(userId, socketId);
  io.emit("onlineUsersUpdate", Array.from(onlineUsers.keys()));
};

export const removeOnlineUser = (userId: string) => {
  onlineUsers.delete(userId);
  io.emit("onlineUsersUpdate", Array.from(onlineUsers.keys()));
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
