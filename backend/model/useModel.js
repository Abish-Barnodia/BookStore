import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        enum: ["customer", "staff", "admin"],
        default: "customer",
    },
    status: {
        type: String,
        enum: ["Active", "Blocked"],
        default: "Active",
    },
    cartData: {
        type: Object,
        default: {}
    },

    address: {
        type: String,
        default: '',
    },

    // Password reset flow (forgot-password -> reset-password)
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpiresAt: {
        type: Date,
        default: null,
    },

}, { timestamps: true, minimize: false })

const User = mongoose.model("User", userSchema)

export default User
