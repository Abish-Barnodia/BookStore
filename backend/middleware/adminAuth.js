import jwt from 'jsonwebtoken';
import AdminUser from '../model/adminModel.js';

const adminAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!verifiedToken?.adminID) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Verify admin exists and is active
        const admin = await AdminUser.findById(verifiedToken.adminID).select('_id email role status');
        
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }

        if (admin.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Admin account is inactive' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

export default adminAuth;


