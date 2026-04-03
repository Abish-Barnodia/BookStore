import express from "express"
import isAuth from "../middleware/isAuth.js"
import { validate, cartItemValidation } from "../middleware/validation.js"
import {
    getCart,
    addToCart,
    updateCart,
    removeFromCart
} from "../controller/cartController.js"

const cartRoutes = express.Router()

cartRoutes.get("/get", isAuth, getCart)
cartRoutes.post("/add", isAuth, validate(cartItemValidation), addToCart)
cartRoutes.put("/update", isAuth, validate(cartItemValidation), updateCart)
cartRoutes.delete("/remove", isAuth, validate(cartItemValidation), removeFromCart)

export default cartRoutes
