import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { addOnlineUser, removeOnlineUser } from "./utils/onlineUsers";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Middleware pour les uploads
app.use(
  "/api/uploads/products",
  express.static(path.join(__dirname, "Uploads", "products"))
);
app.use(
  "/api/uploads/posts",
  express.static(path.join(__dirname, "Uploads", "posts"))
);
app.use(
  "/api/uploads/trips",
  express.static(path.join(__dirname, "Uploads", "trips"))
);
app.use(
  "/api/uploads/groupe",
  express.static(path.join(__dirname, "Uploads", "groupe"))
);

// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import PostRoutes from "./routes/postRoutes";
import TripRoutes from "./routes/TripRoutes";
import ProductRouter from "./routes/productRoutes";
import ChatGroupeRouter from "./routes/groupeChatRoutes";
import ChatsRouter from "./routes/ChatsRoutes";
import ChatproductRouter from "./routes/ChatProductRoutes";

app.get("/", (req, res) => {
  res.send("Bienvenue sur Seekras API ");
});

app.use("/api", [
  authRoutes,
  userRoutes,
  PostRoutes,
  TripRoutes,
  ProductRouter,
  ChatGroupeRouter,
  ChatsRouter,
  ChatproductRouter,
]);

const server = http.createServer(app);

// Initialiser Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Gérer les connexions WebSocket
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;

  if (userId && userId !== "undefined") {
    addOnlineUser(userId, socket.id);
  }

  socket.on("joinGroupe", (groupeIds: string[]) => {
    groupeIds.forEach((groupeId) => {
      socket.join(groupeId);
    });
  });

  socket.on("joinConversations", (conversationIds: string[]) => {
    conversationIds.forEach((conversationId) => {
      socket.join(conversationId);
    });
  });

  socket.on("joinchatProduct", (conversationIds: string[]) => {
    conversationIds.forEach((conversationId) => {
      socket.join(conversationId);
    });
  });

  socket.on("disconnect", () => {
    if (userId) {
      removeOnlineUser(userId);
    }
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
