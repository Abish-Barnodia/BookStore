import Order from "../model/orderModel.js";
import User from "../model/useModel.js";
import Product from "../model/productModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const currency = "INR";

const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

const parseCleanItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => ({
            product: item.product || undefined,
            title: String(item.title || "").trim(),
            qty: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice ?? item.price ?? 0),
        }))
        .filter((item) => item.title && item.qty > 0 && item.unitPrice >= 0);
};

const formatUserOrderRow = (order, reviewedProductIds = new Set()) => {
    const firstItem = order.items?.[0];
    const itemTitle =
        order.items?.length > 1
            ? `${firstItem?.title || '—'} +${order.items.length - 1} more`
            : firstItem?.title || '—';
    const itemCount = order.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
    const date = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '';

    return {
        id: order._id.toString(),
        orderNumber: order.orderNumber || order._id.toString(),
        title: itemTitle,
        itemsCount: itemCount,
        items: Array.isArray(order.items)
            ? order.items.map((item) => {
                  const productId = item?.product ? String(item.product) : "";
                  return {
                      productId,
                      title: item?.title || "",
                      qty: Number(item?.qty || 0),
                      unitPrice: Number(item?.unitPrice || 0),
                      reviewed: productId ? reviewedProductIds.has(productId) : false,
                  };
              })
            : [],
        amount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus || 'Pending',
        paymentMethod: order.paymentMethod || 'cash',
        date,
        address: order.shippingAddress || '',
    };
};

export const PlaceOrder = async (req, res) => {
    try {
        const { items, amount, address, paymentMethod } = req.body || {};
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const cleanItems = parseCleanItems(items);
        if (cleanItems.length === 0) {
            return res.status(400).json({ success: false, message: "Order items are required" });
        }

        const totalAmount = Number(amount);
        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ success: false, message: "Valid order amount is required" });
        }

        const shippingAddress = String(address || "").trim();
        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: "Shipping address is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const orderData = {
            userId,
            customerName: user.name || "Customer",
            customerEmail: user.email,
            shippingAddress,
            items: cleanItems,
            totalAmount,
            status: "Pending",
            paymentMethod: paymentMethod === "razorpay" ? "razorpay" : "cash",
            paymentStatus: "Pending",
        };

        const newOrder = new Order(orderData);
        await newOrder.save();
        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: newOrder,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
        const orderedProductIds = [...new Set(
            orders
                .flatMap((order) => order.items || [])
                .map((item) => (item?.product ? String(item.product) : ""))
                .filter(Boolean)
        )];

        let reviewedProductIds = new Set();
        if (orderedProductIds.length > 0) {
            const productsWithMyReviews = await Product.find(
                {
                    _id: { $in: orderedProductIds },
                    "reviews.userId": userId,
                },
                { _id: 1 }
            ).lean();
            reviewedProductIds = new Set(productsWithMyReviews.map((p) => String(p._id)));
        }

        return res.json({
            success: true,
            orders: orders.map((order) => formatUserOrderRow(order, reviewedProductIds)),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const placeOrderByRazorpay = async (req, res) => {
    try {
        const razorpay = getRazorpayInstance();
        const { items, amount, address } = req.body || {};
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const cleanItems = parseCleanItems(items);
        if (cleanItems.length === 0) {
            return res.status(400).json({ success: false, message: "Order items are required" });
        }

        const totalAmount = Number(amount);
        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ success: false, message: "Valid order amount is required" });
        }

        const shippingAddress = String(address || "").trim();
        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: "Shipping address is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Create local order first, then create Razorpay order.
        const newOrder = new Order({
            userId,
            customerName: user.name || "Customer",
            customerEmail: user.email,
            shippingAddress,
            items: cleanItems,
            totalAmount,
            status: "Pending",
            paymentMethod: "razorpay",
            paymentStatus: "Pending",
        });
        await newOrder.save();

        const options = {
            amount: Math.round(totalAmount * 100), // paise
            currency,
            receipt: String(newOrder._id),
            notes: {
                orderId: String(newOrder._id),
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Store Razorpay order id for later verification
        newOrder.razorpayOrderId = razorpayOrder.id;
        await newOrder.save();

        return res.status(201).json({
            success: true,
            message: "Razorpay order created",
            order: {
                id: newOrder._id,
                orderNumber: newOrder.orderNumber,
            },
            razorpay: {
                orderId: razorpayOrder.id,
                keyId: process.env.RAZORPAY_KEY_ID,
                amountPaise: options.amount,
                currency,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            req.body || {};
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification data missing" });
        }

        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpaySecret) {
            return res.status(500).json({ success: false, message: "Razorpay secret not configured" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", razorpaySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const isValid = expectedSignature === razorpay_signature;
        if (!isValid) {
            await Order.findOneAndUpdate(
                { _id: orderId, userId },
                { paymentStatus: "Failed", razorpaySignature: razorpay_signature },
                { new: true }
            );
            return res.status(400).json({ success: false, message: "Invalid Razorpay signature" });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, userId, razorpayOrderId: razorpay_order_id },
            {
                paymentStatus: "Paid",
                paymentMethod: "razorpay",
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found for this payment" });
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified",
            order: {
                id: updatedOrder._id,
                orderNumber: updatedOrder.orderNumber,
                paymentStatus: updatedOrder.paymentStatus,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
