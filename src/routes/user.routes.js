import { Router } from "express";
import { changeAvatarImage, changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToekn, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlerware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJwt,logoutUser)
router.route("/refresh-token").post(refreshAccessToekn)
router.route("/updatePassword").post(verifyJwt,changePassword)
router.route("/getcurrentuser").post(verifyJwt,getCurrentUser)
router.route("/updateaavtarimage").post(upload.field(
    {
        name:"avatar",
        maxCount:1
    }
    ),verifyJwt,changeAvatarImage)
export default router