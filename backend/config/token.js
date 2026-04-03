//JWT
import jwt from "jsonwebtoken"

export const genToken = async (userID) => {
    try {
        // Reduced from 25 days to 24 hours (access token approach)
        // Pair with refresh token for longer sessions
        let token = jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: "24h" })
        return token
    } catch (error) {
        console.log("token error:", error)
        throw error
    }
}

export const genTokenAdmin = async (adminID) => {
    try {
        // Admin tokens are shorter - 8 hours for security
        let token = jwt.sign({ adminID }, process.env.JWT_SECRET, { expiresIn: "8h" })
        return token
    } catch (error) {
        console.log("token error:", error)
        throw error
    }
}