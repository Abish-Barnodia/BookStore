import Product from "../model/productModel.js";
import mongoose from "mongoose";
import Order from "../model/orderModel.js";
import User from "../model/useModel.js";

const toProductShape = (p) => ({
    reviews: Array.isArray(p.reviews)
        ? p.reviews
              .slice()
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
              .map((r) => ({
                  name: r.name,
                  rating: Number(r.rating || 0),
                  text: r.text,
                  deliveryImageUrl: r.deliveryImageUrl || "",
                  createdAt: r.createdAt,
              }))
        : [],
    rating:
        Array.isArray(p.reviews) && p.reviews.length > 0
            ? Number(
                  (
                      p.reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
                      p.reviews.length
                  ).toFixed(1)
              )
            : 4.5,
    id: p._id.toString(),
    title: p.title,
    author: p.author,
    category: p.category,
    price: p.price,
    stock: p.stock,
    imageUrl: p.imageUrl || p.image1 || "",
    image1: p.image1 || "",
    image2: p.image2 || "",
    image3: p.image3 || "",
    bestSeller: Boolean(p.bestSeller),
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listStoreProducts = async (req, res) => {
    try {
        const category = String(req.query?.category || "").trim();
        const filter = category
            ? { category: { $regex: `^${escapeRegex(category)}$`, $options: "i" } }
            : {};

        const products = await Product.find(filter).sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ success: true, products: products.map(toProductShape) });
    } catch (error) {
        console.error("listStoreProducts:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
};

export const getStoreProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const p = await Product.findById(id).lean();
        if (!p) return res.status(404).json({ success: false, message: "Product not found" });
        return res.status(200).json({ success: true, product: toProductShape(p) });
    } catch (error) {
        console.error("getStoreProduct:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
};

export const addStoreProductReview = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const text = String(req.body?.text || "").trim();
        const rating = Number(req.body?.rating || 0);

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid product id" });
        }
        if (!text) {
            return res.status(400).json({ success: false, message: "Review text is required" });
        }
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }
        if (!req.file?.filename) {
            return res.status(400).json({ success: false, message: "Delivered product image is required" });
        }

        const [product, user] = await Promise.all([
            Product.findById(id),
            User.findById(userId).select("name"),
        ]);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const hasDeliveredOrder = await Order.exists({
            userId,
            status: "Delivered",
            "items.product": id,
        });

        if (!hasDeliveredOrder) {
            return res.status(403).json({
                success: false,
                message: "Only users with a delivered order can review this book",
            });
        }

        const deliveryImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        const existingIndex = (product.reviews || []).findIndex(
            (r) => String(r.userId) === String(userId)
        );
        const nextReview = {
            userId,
            name: user.name || "Customer",
            rating,
            text,
            deliveryImageUrl,
            createdAt: new Date(),
        };

        if (existingIndex >= 0) {
            product.reviews[existingIndex] = nextReview;
        } else {
            product.reviews.push(nextReview);
        }

        await product.save();
        return res.status(201).json({
            success: true,
            message: "Review submitted",
            product: toProductShape(product.toObject()),
        });
    } catch (error) {
        console.error("addStoreProductReview:", error);
        return res.status(500).json({ success: false, message: "Failed to submit review" });
    }
};
