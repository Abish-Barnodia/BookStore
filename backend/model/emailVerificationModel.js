import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expireAfterSeconds: 0 }, // Auto-delete after expiration
        },
        verified: {
            type: Boolean,
            default: false,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const EmailVerification = mongoose.model(
    "EmailVerification",
    emailVerificationSchema
);

export default EmailVerification;
