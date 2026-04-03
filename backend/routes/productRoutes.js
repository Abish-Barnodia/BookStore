import express from "express";
import {
	listStoreProducts,
	getStoreProduct,
	addStoreProductReview,
} from "../controller/productController.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { validate, reviewValidation } from "../middleware/validation.js";

const productRoutes = express.Router();

productRoutes.get("/list", listStoreProducts);
productRoutes.post("/:id/reviews", isAuth, upload.single("deliveryImage"), validate(reviewValidation), addStoreProductReview);
productRoutes.get("/:id", getStoreProduct);

export default productRoutes;
