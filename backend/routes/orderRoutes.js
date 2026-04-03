import express from "express";
import isAuth from "../middleware/isAuth.js";
import requireUserAccess from "../middleware/requireUserAccess.js";
import { PlaceOrder, getMyOrders, placeOrderByRazorpay, verifyRazorpayPayment } from "../controller/orderController.js";

const orderRoutes = express.Router();

orderRoutes.post("/place", isAuth, requireUserAccess(), PlaceOrder);
orderRoutes.get("/my-orders", isAuth, requireUserAccess(), getMyOrders);
orderRoutes.post("/place-orderbyrazorpay", isAuth, requireUserAccess(), placeOrderByRazorpay);
orderRoutes.post("/place-order", isAuth, requireUserAccess(), PlaceOrder);
orderRoutes.post("/verify-razorpay", isAuth, requireUserAccess(), verifyRazorpayPayment);

export default orderRoutes;
