import express from "express";
import isAuth from "../middleware/isAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import upload from "../middleware/multer.js";
import { validate, productValidation } from "../middleware/validation.js";
import {
    adminStats,
    listProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    listOrders,
    patchOrder,
    listUsers,
    patchUser,
} from "../controller/adminController.js";

const adminRoutes = express.Router();
adminRoutes.use(isAuth, requireAdmin);

adminRoutes.get("/stats", adminStats);
adminRoutes.get("/products", listProducts);
adminRoutes.get("/products/:id", getProduct);
adminRoutes.post("/products", upload.single("image"), validate(productValidation), createProduct);
adminRoutes.put("/products/:id", upload.single("image"), validate(productValidation), updateProduct);
adminRoutes.delete("/products/:id", deleteProduct);
adminRoutes.get("/orders", listOrders);
adminRoutes.patch("/orders/:id", patchOrder);
adminRoutes.get("/users", listUsers);
adminRoutes.patch("/users/:id", patchUser);

export default adminRoutes;
