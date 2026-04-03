import User from "../model/useModel.js"
import AdminUser from "../model/adminModel.js"
import bcrypt from "bcrypt"
import mongoose from "mongoose"

export const getUser = async (req, res) => {
    try {
        const userId = req.user?._id
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        let user;
        if (req.user?.isAdmin) {
            user = await AdminUser.findById(userId).select("-password -accountLockedUntil -loginAttempts");
        } else {
            user = await User.findById(userId).select(
                "-password -resetPasswordToken -resetPasswordExpiresAt"
            )
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }   
        return res.status(200).json({message: "User found", user})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const updateUser = async (req, res) => {
    try {
        const userId = req.user?._id
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        let user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        let { name, email, password, address } = req.body
        user.name = name || user.name
        user.email = email || user.email
        if (typeof address === 'string') {
            user.address = address || user.address
        }
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters" })
            }
            user.password = await bcrypt.hash(password, 10)
        }
        await user.save()
        return res.status(200).json({message: "User updated", user})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const getadminUsers = async (req, res) => {
    try {
        let adminEmail = req.adminEmail;
        if (!adminEmail) {
            return res.status(401).json({ message: "Unauthorized" })
        }
       return res.status(200).json({
        email: "adminEmail",
        role: "admin"
       })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: `getAdmin error ${error.message}`})
    }
}