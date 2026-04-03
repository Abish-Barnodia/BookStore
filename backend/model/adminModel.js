import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["admin", "super-admin"],
            default: "admin",
        },
        permissions: [
            {
                type: String,
                enum: [
                    "manage_products",
                    "manage_orders",
                    "manage_users",
                    "view_stats",
                    "manage_admins",
                ],
            },
        ],
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        loginAttempts: {
            type: Number,
            default: 0,
        },
        accountLockedUntil: {
            type: Date,
            default: null,
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdminUser",
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Index for faster lookups
adminUserSchema.index({ email: 1 });
adminUserSchema.index({ status: 1 });

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;
