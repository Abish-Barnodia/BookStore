import AuditLog from "../model/auditLogModel.js";

/**
 * Log audit activity
 * @param {Object} options - Audit log details
 * @param {string} options.action - Action performed
 * @param {string} options.actorId - User/Admin ID performing action
 * @param {string} options.actorEmail - Email of actor
 * @param {string} options.actorRole - Role of actor (admin, customer, system)
 * @param {string} options.resourceType - Type of resource (Product, Order, User)
 * @param {string} options.resourceId - ID of resource
 * @param {Object} options.changes - { before, after }
 * @param {string} options.status - SUCCESS or FAILURE
 * @param {string} options.errorMessage - Error message if failed
 * @param {string} options.ipAddress - IP address of request
 * @param {string} options.userAgent - User agent string
 */
export const logAudit = async (options) => {
    try {
        const {
            action,
            actorId,
            actorEmail = "system",
            actorRole = "system",
            resourceType,
            resourceId,
            changes = {},
            status = "SUCCESS",
            errorMessage = null,
            ipAddress = null,
            userAgent = null,
        } = options;

        if (!action) {
            console.warn("[audit] Missing action");
            return;
        }

        const auditEntry = new AuditLog({
            action,
            actor: actorId || null,
            actorEmail,
            actorRole,
            resourceType: resourceType || null,
            resourceId: resourceId || null,
            changes,
            status,
            errorMessage,
            ipAddress,
            userAgent,
        });

        await auditEntry.save();
    } catch (error) {
        console.error("[audit] Failed to log audit entry:", error);
        // Don't throw - audit logging failure shouldn't break the app
    }
};

/**
 * Helper to extract IP address from request
 */
export const getClientIp = (req) => {
    return (
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown"
    );
};

/**
 * Helper to get user agent from request
 */
export const getUserAgent = (req) => {
    return req.headers["user-agent"] || "unknown";
};
