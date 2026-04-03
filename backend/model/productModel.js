import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true, trim: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        text: { type: String, required: true, trim: true },
        deliveryImageUrl: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        author: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        imageUrl: { type: String, default: "" },
        image1: { type: String, default: "" },
        image2: { type: String, default: "" },
        image3: { type: String, default: "" },
        bestSeller: { type: Boolean, default: false },
        reviews: { type: [reviewSchema], default: [] },
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
