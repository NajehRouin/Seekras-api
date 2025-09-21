import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import multer from "multer";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
const productService = new ProductService();

// Middleware Multer
const uploadProduct = require("../middlewares/uploadProduct").default;
// Middleware pour gérer les uploads multiples
export const uploadProductImages = uploadProduct.array("images", 5); // Max 10 images

// Contrôleur
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user?.id?._id;
    const product = await productService.createProduct(
      userId,
      req.body,
      req.files as Express.Multer.File[]
    );
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création du produit" });
  }
};

// Lister tous les produits
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id?._id;
    const products = await productService.getAllProducts(userId);
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des produits" });
  }
};

// Récupérer un produit par ID
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Produit non trouvé" });
    res.json(product);
  } catch (error: any) {
    console.error(`Error in getProduct for ID ${req.params.id}:`, error);
    res.status(500).json({
      error: "Erreur lors de la récupération du produit",
      details: error.message,
    });
  }
};

// Incrémenter les vues
export const incrementViews = async (req: Request, res: Response) => {
  try {
    const product = await productService.incrementViewCount(req.params.id);
    if (!product) return res.status(404).json({ error: "Produit non trouvé" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'incrémentation des vues" });
  }
};

export const likeProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id?._id;

    const product = await productService.toggleLike(req.params.id, userId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const productsLikes = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;

    const products = await productService.productsLikes(userId);
    if (!products) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const productCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id?._id;

    const products = await productService.productByCurrentUser(userId);
    if (!products) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const productsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const products = await productService.productByUser(userId);
    if (!products) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    const product = await productService.updateProductStatus(productId, status);
    return res.status(200).json({
      success: true,
      message: `Product status updated to  ${status}`,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
