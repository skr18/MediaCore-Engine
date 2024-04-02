import { Router } from "express";
import { changeAvatarImage, changePassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToekn, registerUser } from "../controllers/user.controller.js";
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
router.route("/getcurrentuser").get(verifyJwt,getCurrentUser)
router.route("/updateaavtarimage").patch(verifyJwt,upload.single("avatar"),changeAvatarImage)
router.route("/c/:username").get(verifyJwt,getUserChannelProfile)
router.route("/getwatchhistory").get(verifyJwt,getWatchHistory)

export default router