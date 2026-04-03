import User from "../model/useModel.js";
import AdminUser from "../model/adminModel.js";

const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        let user;
        if (req.user?.isAdmin) {
            user = await AdminUser.findById(userId).select("role status").lean();
        } else {
            user = await User.findById(userId).select("role status").lean();
        }
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (user.status === "Blocked" || user.status === "inactive") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        if (user.role !== "admin" && user.role !== "super-admin") {
            return res.status(403).json({ success: false, message: "Forbidden: admin access required" });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export default requireAdmin;