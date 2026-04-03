import express from "express"
import { getUser, updateUser } from "../controller/userController.js"
import isAuth from "../middleware/isAuth.js"
import requireUserAccess from "../middleware/requireUserAccess.js"
import { validate, updateProfileValidation } from "../middleware/validation.js"

const userRoutes = express.Router()

userRoutes.post("/get-user", isAuth, requireUserAccess(), getUser)
userRoutes.put("/update-user", isAuth, requireUserAccess(), validate(updateProfileValidation), updateUser)

export default userRoutes
