import express from "express";
import upload from "../middlewares/upload";
import { authenticateToken } from "../middlewares/authMiddleware";

import {
  createProduct,
  getProduct,
  getProducts,
  incrementViews,
  likeProduct,
  productCurrentUser,
  productsByUser,
  productsLikes,
  updateStatus,
} from "../controllers/ProductController";
import { uploadProductImages } from "../controllers/ProductController";
const router = express.Router();

router.post(
  "/create-product",
  authenticateToken,
  uploadProductImages,
  (req, res, next) => {
    createProduct(req, res).catch(next);
  }
);
// Lister tous les produits
router.get("/products", authenticateToken, (req, res, next) => {
  getProducts(req, res).catch(next);
});

router.get("/products/:id", (req, res, next) => {
  getProduct(req, res).catch(next);
});
// Incrémenter les vues
router.post("/products/:id/view", (req, res, next) => {
  incrementViews(req, res).catch(next);
});

router.post("/products/:id/like", authenticateToken, async (req, res, next) => {
  likeProduct(req, res).catch(next);
});

router.get("/listLikes", authenticateToken, async (req, res, next) => {
  productsLikes(req, res).catch(next);
});

router.get(
  "/productsCurrentUser",
  authenticateToken,
  async (req, res, next) => {
    productCurrentUser(req, res).catch(next);
  }
);

router.post("/products/:productId/status", async (req, res, next) => {
  updateStatus(req, res).catch(next);
});

router.get("/productsByUser/:userId", async (req, res, next) => {
  productsByUser(req, res).catch(next);
});
export default router;
