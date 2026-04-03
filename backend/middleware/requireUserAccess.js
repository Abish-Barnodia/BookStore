import User from "../model/useModel.js";

const DEFAULT_USER_ROLES = ["customer", "staff", "admin"];

const requireUserAccess = (allowedRoles = DEFAULT_USER_ROLES) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            // Keep customer APIs isolated from admin-token sessions.
            if (req.user?.isAdmin) {
                return res.status(403).json({ success: false, message: "Forbidden: customer access required" });
            }

            const user = await User.findById(userId).select("role status").lean();
            if (!user) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const normalizedStatus = String(user.status || "").toLowerCase();
            if (normalizedStatus !== "active") {
                return res.status(403).json({ success: false, message: "Access denied: account inactive" });
            }

            if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
            }

            req.currentUser = user;
            next();
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    };
};

export default requireUserAccess;