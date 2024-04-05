import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError, apiError} from "../utils/ApiError.js"
import {ApiResponse, apiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new apiError(400,"videoId is not vaild ")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"video not found")
    }

    const isLiked = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })
    if(isLiked){
        await Like.findByIdAndDelete(isLiked?._id)
        return res
        .status(200)
        .json(new apiResponse(200,{liked:false},"video disliked successfully"))
    }

    await Like.create({
        video:videoId,
        likedBy:req.user?._id
    })
    return res
    .status(200)
    .json(new apiResponse(200,{liked:true},"video liked successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new apiError(400,"commentId is not vaild ")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new apiError(404,"comment not found")
    }

    const isLiked = await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })
    if(isLiked){
        await Like.findByIdAndDelete(isLiked?._id)
        return res
        .status(200)
        .json(new apiResponse(200,{liked:false},"comment disliked successfully"))
    }

    await Like.create({
        comment:commentId,
        likedBy:req.user?._id
    })
    return res
    .status(200)
    .json(new apiResponse(200,{liked:true},"comment liked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new apiError(400,"tweetId is not vaild ")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new apiError(404,"tweet not found")
    }

    const isLiked = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    if(isLiked){
        await Like.findByIdAndDelete(isLiked?._id)
        return res
        .status(200)
        .json(new apiResponse(200,{liked:false},"tweet disliked successfully"))
    }

    await Like.create({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    return res
    .status(200)
    .json(new apiResponse(200,{liked:true},"tweet liked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}