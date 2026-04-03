import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)
        if (!verifiedToken?.userID) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        // Controllers use req.user._id (see userController)
        req.user = { _id: verifiedToken.userID }
        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ message: "Unauthorized" })
    }
}

export default isAuth
