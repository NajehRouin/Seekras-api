import express from "express";
import {
  addActivity,
  addSupplies,
  createTripController,
  getTripByCurrentUser,
  getTripById,
  updateSupplyStatus,
} from "../controllers/tripController";
import { authenticateToken } from "../middlewares/authMiddleware";
const router = express.Router();

router.post("/create-trip", (req, res, next) => {
  createTripController(req, res).catch(next);
});

router.get("/Alltrips", authenticateToken, (req, res, next) => {
  getTripByCurrentUser(req, res).catch(next);
});

router.post("/tripById", (req, res, next) => {
  getTripById(req, res).catch(next);
});
router.patch("/updateSupplyStatus", (req, res, next) => {
  updateSupplyStatus(req, res).catch(next);
});

router.post("/addActivity", (req, res, next) => {
  addActivity(req, res).catch(next);
});

router.post("/addSupply", (req, res, next) => {
  addSupplies(req, res).catch(next);
});

export default router;
