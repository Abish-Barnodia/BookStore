import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            enum: [
                "LOGIN",
                "LOGOUT",
                "LOGIN_FAILED",
                "PASSWORD_CHANGED",
                "PASSWORD_RESET",
                "EMAIL_VERIFIED",
                "CREATE_PRODUCT",
                "UPDATE_PRODUCT",
                "DELETE_PRODUCT",
                "CREATE_ORDER",
                "UPDATE_ORDER",
                "CREATE_USER",
                "UPDATE_USER",
                "DELETE_USER",
                "BLOCK_USER",
                "UNBLOCK_USER",
                "CREATE_ADMIN",
                "UPDATE_ADMIN",
                "DELETE_ADMIN",
                "VIEW_SENSITIVE_DATA",
            ],
            index: true,
        },
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        actorEmail: {
            type: String,
            trim: true,
        },
        actorRole: {
            type: String,
            enum: ["admin", "customer", "system"],
        },
        resourceType: {
            type: String,
            enum: ["Product", "Order", "User", "AdminUser", "Auth"],
        },
        resourceId: {
            type: String,
        },
        changes: {
            before: mongoose.Schema.Types.Mixed,
            after: mongoose.Schema.Types.Mixed,
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILURE"],
            default: "SUCCESS",
            index: true,
        },
        errorMessage: {
            type: String,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: false }
);

// Compound index for filtering by action and date
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actorEmail: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
