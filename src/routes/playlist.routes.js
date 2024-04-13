import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJwt)

router.route("/").post(createPlaylist);

router
    .route("/p:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/v:videoId/p:playlistId").patch(addVideoToPlaylist);
router.route("/remove/v:videoId/p:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/u:userId").get(getUserPlaylists);

export default router;