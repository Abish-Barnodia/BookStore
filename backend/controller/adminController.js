import mongoose from "mongoose";
import Product from "../model/productModel.js";
import Order from "../model/orderModel.js";
import User from "../model/useModel.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";

const toProductShape = (p) => ({
    id: p._id.toString(),
    title: p.title,
    author: p.author,
    category: p.category,
    price: p.price,
    stock: p.stock,
    img: (p.imageUrl || p.image1)?.trim() ? (p.imageUrl || p.image1) : "📗",
    imageUrl: p.imageUrl || p.image1 || "",
});

const formatOrderRow = (o) => {
    const first = o.items?.[0];
    const titleSummary =
        o.items?.length > 1
            ? `${first?.title || "—"} +${o.items.length - 1} more`
            : first?.title || "—";
    const qty = o.items?.reduce((s, i) => s + (i.qty || 0), 0) || 0;
    const date = o.createdAt
        ? new Date(o.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "";
    return {
        _id: o._id.toString(),
        id: `#${o.orderNumber || o._id.toString()}`,
        customer: o.customerName,
        email: o.customerEmail,
        book: titleSummary,
        qty,
        amount: o.totalAmount,
        paymentStatus: o.paymentStatus || "Pending",
        status: o.status,
        date,
        address: o.shippingAddress || "",
    };
};

const formatUserRow = (u) => ({
    id: u._id.toString(),
    name: u.name || "—",
    email: u.email,
    role: u.role || "customer",
    status: u.status || "Active",
    joined: u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "",
    orders: 0,
    spent: 0,
});

export const listProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ updatedAt: -1 }).lean();
        return res.json({ success: true, products: products.map(toProductShape) });
    } catch (e) {
        console.error("listProducts:", e);
        return res.status(500).json({ success: false, message: "Failed to list products" });
    }
};

export const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid product id" });
        }
        const p = await Product.findById(id).lean();
        if (!p) return res.status(404).json({ success: false, message: "Product not found" });
        return res.json({ success: true, product: toProductShape(p) });
    } catch (e) {
        console.error("getProduct:", e);
        return res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { title, author, category, price, stock, bestSeller } = req.body || {};
        if (!title || !author || price == null || price === "") {
            return res.status(400).json({ success: false, message: "Title, author, and price are required" });
        }

        // Upload image to Cloudinary if a file was attached
        let imageUrl = "";
        if (req.file?.path) {
            const uploaded = await uploadOnCloudinary(req.file.path);
            if (!uploaded) {
                return res.status(500).json({ success: false, message: "Image upload to Cloudinary failed" });
            }
            imageUrl = uploaded;
        }

        const product = await Product.create({
            title: String(title).trim(),
            author: String(author).trim(),
            category: String(category || "General").trim(),
            price: Number(price),
            stock: stock != null ? Number(stock) : 0,
            bestSeller: String(bestSeller).toLowerCase() === "true",
            imageUrl,
        });
        return res.status(201).json({ success: true, product: toProductShape(product) });
    } catch (e) {
        console.error("createProduct:", e);
        return res.status(500).json({ success: false, message: "Failed to create product" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid product id" });
        }
        const { title, author, category, price, stock, bestSeller } = req.body || {};
        const updates = {};
        if (title != null) updates.title = String(title).trim();
        if (author != null) updates.author = String(author).trim();
        if (category != null) updates.category = String(category).trim();
        if (price != null) updates.price = Number(price);
        if (stock != null) updates.stock = Number(stock);
        if (bestSeller != null) updates.bestSeller = String(bestSeller).toLowerCase() === "true";

        // Upload new image to Cloudinary if a file was attached
        if (req.file?.path) {
            const uploaded = await uploadOnCloudinary(req.file.path);
            if (!uploaded) {
                return res.status(500).json({ success: false, message: "Image upload to Cloudinary failed" });
            }
            updates.imageUrl = uploaded;
        }

        const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
            .lean();
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        return res.json({ success: true, product: toProductShape(product) });
    } catch (e) {
        console.error("updateProduct:", e);
        return res.status(500).json({ success: false, message: "Failed to update product" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid product id" });
        }
        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Product not found" });
        return res.json({ success: true, message: "Product deleted" });
    } catch (e) {
        console.error("deleteProduct:", e);
        return res.status(500).json({ success: false, message: "Failed to delete product" });
    }
};

export const listOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        return res.json({ success: true, orders: orders.map(formatOrderRow) });
    } catch (e) {
        console.error("listOrders:", e);
        return res.status(500).json({ success: false, message: "Failed to list orders" });
    }
};

const nextStatus = { Pending: "Shipped", Shipped: "Delivered" };

export const patchOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid order id" });
        }
        const { status } = req.body || {};
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (status) {
            const allowed = ["Pending", "Shipped", "Delivered", "Cancelled"];
            if (!allowed.includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status" });
            }
            order.status = status;
        } else {
            const n = nextStatus[order.status];
            if (n) order.status = n;
            else return res.status(400).json({ success: false, message: "Cannot advance status" });
        }

        await order.save();
        return res.json({ success: true, order: formatOrderRow(order.toObject()) });
    } catch (e) {
        console.error("patchOrder:", e);
        return res.status(500).json({ success: false, message: "Failed to update order" });
    }
};

export const listUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password -resetPasswordToken -resetPasswordExpiresAt")
            .sort({ createdAt: -1 })
            .lean();

        const orderAgg = await Order.aggregate([
            { $match: { userId: { $exists: true, $ne: null } } },
            { $group: { _id: "$userId", count: { $sum: 1 }, spent: { $sum: "$totalAmount" } } },
        ]);
        const byUser = Object.fromEntries(
            orderAgg.map((a) => [String(a._id || ""), { orders: a.count, spent: a.spent || 0 }])
        );

        const rows = users.map((u) => {
            const row = formatUserRow(u);
            const stats = byUser[u._id.toString()];
            if (stats) {
                row.orders = stats.orders;
                row.spent = stats.spent;
            }
            return row;
        });

        return res.json({ success: true, users: rows });
    } catch (e) {
        console.error("listUsers:", e);
        return res.status(500).json({ success: false, message: "Failed to list users" });
    }
};

export const patchUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user id" });
        }
        const { role, status } = req.body || {};
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (role != null) {
            const roles = ["customer", "staff", "admin"];
            if (!roles.includes(role)) {
                return res.status(400).json({ success: false, message: "Invalid role" });
            }
            user.role = role;
        }
        if (status != null) {
            if (!["Active", "Blocked"].includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status" });
            }
            user.status = status;
        }

        await user.save();
        const u = await User.findById(id)
            .select("-password -resetPasswordToken -resetPasswordExpiresAt")
            .lean();
        return res.json({ success: true, user: formatUserRow(u) });
    } catch (e) {
        console.error("patchUser:", e);
        return res.status(500).json({ success: false, message: "Failed to update user" });
    }
};

export const adminStats = async (req, res) => {
    try {
        const [productCount, userCount, orderCount, recentOrdersDocs, lowStock, byStatus] =
            await Promise.all([
                Product.countDocuments(),
                User.countDocuments(),
                Order.countDocuments(),
                Order.find().sort({ createdAt: -1 }).limit(8).lean(),
                Product.countDocuments({ stock: { $lte: 5, $gt: 0 } }),
                Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
            ]);

        const statusCounts = Object.fromEntries(byStatus.map((b) => [b._id, b.n]));

        return res.json({
            success: true,
            stats: {
                productCount,
                userCount,
                orderCount,
                pendingOrders: statusCounts.Pending || 0,
                lowStockBooks: lowStock,
                statusCounts,
                recentOrders: recentOrdersDocs.map(formatOrderRow),
            },
        });
    } catch (e) {
        console.error("adminStats:", e);
        return res.status(500).json({ success: false, message: "Failed to load stats" });
    }
};
