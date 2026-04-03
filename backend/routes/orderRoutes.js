import express from "express";
import isAuth from "../middleware/isAuth.js";
import { PlaceOrder, getMyOrders, placeOrderByRazorpay, verifyRazorpayPayment } from "../controller/orderController.js";

const orderRoutes = express.Router();

orderRoutes.post("/place", isAuth, PlaceOrder);
orderRoutes.get("/my-orders", isAuth, getMyOrders);
orderRoutes.post("/place-orderbyrazorpay", isAuth, placeOrderByRazorpay);
orderRoutes.post("/place-order", isAuth, PlaceOrder);
orderRoutes.post("/verify-razorpay", isAuth, verifyRazorpayPayment);

export default orderRoutes;
