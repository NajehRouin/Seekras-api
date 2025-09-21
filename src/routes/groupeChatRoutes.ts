import express from "express";

import { authenticateToken } from "../middlewares/authMiddleware";
import {
  addMemberToGroupe,
  addMessageGroupe,
  createChatGroupe,
  deleteMembre,
  detailsgroupe,
  getAllGroupe,
  getConversationGroupe,
  listUsers,
  updateGroupe,
  uploadGroupeImages,
} from "../controllers/ChatGroupController";

const router = express.Router();

router.post(
  "/create-groupe",
  authenticateToken,
  uploadGroupeImages,
  (req, res, next) => {
    createChatGroupe(req, res).catch(next);
  }
);

router.get("/Allgroupe", authenticateToken, (req, res, next) => {
  getAllGroupe(req, res).catch(next);
});

router.get(
  "/groupe/:groupeId/messages",
  authenticateToken,
  (req, res, next) => {
    getConversationGroupe(req, res).catch(next);
  }
);

router.post(
  "/groupe/:groupeId/messages",
  authenticateToken,
  (req, res, next) => {
    addMessageGroupe(req, res).catch(next);
  }
);

router.get("/groupeinfo/:groupeId", (req, res, next) => {
  detailsgroupe(req, res).catch(next);
});

router.delete("/deletMembre/:groupeId", (req, res, next) => {
  deleteMembre(req, res).catch(next);
});

router.get("/membersgroupe/:groupeId", (req, res, next) => {
  listUsers(req, res).catch(next);
});

router.post(
  "/addMemberGroupe/:groupeId",

  (req, res, next) => {
    addMemberToGroupe(req, res).catch(next);
  }
);

router.put("/updateGroupe/:groupeId", uploadGroupeImages, (req, res, next) => {
  updateGroupe(req, res).catch(next);
});

export default router;
