import Product, { IProduct } from "../models/Products";

import mongoose from "mongoose";

export class ProductService {
  async createProduct(
    userId: string,
    data: Partial<IProduct>,
    files?: Express.Multer.File[]
  ): Promise<IProduct> {
    let image = data.image || "";
    let additionalImages: string[] = [];

    if (files && files.length > 0) {
      files.forEach((file) => {
        const filePath = `/uploads/products/${file.filename}`;
        if (additionalImages.length === 0) {
          image = image || filePath; // Si image non fournie, prendre la 1ère
        }
        additionalImages.push(filePath);
      });

      if (!data.image && additionalImages.length > 0) {
        image = additionalImages[0]; // Prendre automatiquement la 1ère image
      }
    }

    const product = new Product({
      ...data,
      userId,
      image,
      additionalImages,
    });

    return await product.save();
  }

  // Récupérer tous les produits
  async getAllProducts(userId: string): Promise<IProduct[]> {
    return await Product.find({ userId: { $ne: userId } });
  }

  // Récupérer un produit par ID
  async getProductById(id: string): Promise<IProduct | null> {
    try {
      const product = await Product.findById(id).populate({
        path: "userId",
        select: "profileId",
        populate: {
          path: "profileId",
          select: "fullName profileImage",
        },
      });
      if (!product) {
        console.log(`Product not found for ID: ${id}`);
        return null;
      }
      return product;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  // Incrémenter les vues d’un produit
  async incrementViewCount(id: string): Promise<IProduct | null> {
    return await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
  }

  async toggleLike(
    productId: string,
    userId: string
  ): Promise<IProduct | null> {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    const hasLiked = product.likedBy.includes(userObjectId);

    const update = hasLiked
      ? { $pull: { likedBy: userObjectId } }
      : { $push: { likedBy: userObjectId } };

    const updatedProduct = await Product.findByIdAndUpdate(productId, update, {
      new: true,
      runValidators: true,
    }).populate({
      path: "userId",
      select: "profileId",
      populate: {
        path: "profileId",
        select: "fullName profileImage",
      },
    });

    return updatedProduct;
  }

  async productByCurrentUser(userId: string): Promise<IProduct[]> {
    return await Product.find({ userId: userId }).lean();
  }

  async productByUser(userId: string): Promise<IProduct[]> {
    return await Product.find({ userId: userId }).lean();
  }

  async productsLikes(userId: string): Promise<IProduct[]> {
    return await Product.find({ likedBy: userId }).lean();
  }

  // Update product status
  async updateProductStatus(
    productId: string,
    newStatus: "active" | "sold" | "reserved"
  ): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product ID");
    }

    if (!["active", "sold", "reserved"].includes(newStatus)) {
      throw new Error("Invalid status. Must be 'sold' or 'reserved'");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.status === newStatus) {
      throw new Error(`Product is already ${newStatus}`);
    }

    // Update only the status field to avoid validation errors
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: { status: newStatus } },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error("Product not found after update");
    }

    return updatedProduct;
  }
}
