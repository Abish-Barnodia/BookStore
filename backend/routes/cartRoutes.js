import express from "express"
import isAuth from "../middleware/isAuth.js"
import requireUserAccess from "../middleware/requireUserAccess.js"
import { validate, cartItemValidation } from "../middleware/validation.js"
import {
    getCart,
    addToCart,
    updateCart,
    removeFromCart
} from "../controller/cartController.js"

const cartRoutes = express.Router()

cartRoutes.get("/get", isAuth, requireUserAccess(), getCart)
cartRoutes.post("/add", isAuth, requireUserAccess(), validate(cartItemValidation), addToCart)
cartRoutes.put("/update", isAuth, requireUserAccess(), validate(cartItemValidation), updateCart)
cartRoutes.delete("/remove", isAuth, requireUserAccess(), validate(cartItemValidation), removeFromCart)

export default cartRoutes
