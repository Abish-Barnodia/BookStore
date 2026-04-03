import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, unique: true, sparse: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        customerName: { type: String, required: true, trim: true },
        customerEmail: { type: String, required: true, trim: true },
        shippingAddress: { type: String, default: "" },
        items: { type: [orderItemSchema], default: [] },
        totalAmount: { type: Number, required: true, min: 0 },
        paymentMethod: { type: String, default: "cash" }, // cash | razorpay
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        razorpayOrderId: { type: String, default: "" },
        razorpayPaymentId: { type: String, default: "" },
        razorpaySignature: { type: String, default: "" },
        status: {
            type: String,
            enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

orderSchema.pre("save", function assignOrderNumber() {
    if (!this.orderNumber) {
        const n = Date.now().toString(36).toUpperCase();
        const r = Math.random().toString(36).slice(2, 6).toUpperCase();
        this.orderNumber = `ORD-${n}-${r}`;
    }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
