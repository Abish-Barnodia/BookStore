import User from "../model/useModel.js"

export const getCart = async (req, res) => {
    try {
        let user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.status(200).json({
            message: "Cart fetched successfully",
            cartData: user.cartData || {}
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const addToCart = async (req, res) => {
    try {
        let user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        let { itemId, quantity } = req.body || {}
        if (!itemId) {
            return res.status(400).json({ message: "itemId is required" })
        }

        quantity = Number(quantity || 1)
        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" })
        }

        let cartData = { ...(user.cartData || {}) }
        cartData[itemId] = Number(cartData[itemId] || 0) + quantity

        user.cartData = cartData
        await user.save()
        return res.status(200).json({
            message: "Item added to cart",
            cartData: user.cartData
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const updateCart = async (req, res) => {
    try {
        let user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        let { itemId, quantity } = req.body || {}
        if (!itemId) {
            return res.status(400).json({ message: "itemId is required" })
        }

        quantity = Number(quantity)
        if (Number.isNaN(quantity)) {
            return res.status(400).json({ message: "Valid quantity is required" })
        }

        let cartData = { ...(user.cartData || {}) }
        if (quantity <= 0) {
            delete cartData[itemId]
        } else {
            cartData[itemId] = quantity
        }

        user.cartData = cartData
        await user.save()
        return res.status(200).json({
            message: "Cart updated successfully",
            cartData: user.cartData
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const removeFromCart = async (req, res) => {
    try {
        let user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        let { itemId } = req.body || {}
        if (!itemId) {
            return res.status(400).json({ message: "itemId is required" })
        }

        let cartData = { ...(user.cartData || {}) }
        delete cartData[itemId]

        user.cartData = cartData
        await user.save()
        return res.status(200).json({
            message: "Item removed from cart",
            cartData: user.cartData
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}
