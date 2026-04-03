import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)

        // Support both regular user tokens (userID) and admin tokens (adminID)
        const id = verifiedToken?.userID || verifiedToken?.adminID
        if (!id) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        // Flag admin tokens so controllers can query the right model
        req.user = {
            _id: id,
            isAdmin: Boolean(verifiedToken?.adminID),
        }
        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ message: "Unauthorized" })
    }
}

export default isAuth
