import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller";

const router = Router()

router.use(verifyJwt)

router.route("/liked-videos").get(getLikedVideos)
router.route("/toggle/c:commentId").post(toggleCommentLike)
router.route("/toggle/v:videoId").post(toggleVideoLike)
router.route("/toggle/t:tweetId").post(toggleTweetLike)

export default router