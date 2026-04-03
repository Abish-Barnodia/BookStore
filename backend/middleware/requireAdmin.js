import User from "../model/useModel.js";

const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findById(userId).select("role status").lean();
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (user.status === "Blocked") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Forbidden: admin access required" });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export default requireAdmin;