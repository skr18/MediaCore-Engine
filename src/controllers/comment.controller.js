import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//not done
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    // const allComments = await Video.aggregate([
    //     {
    //         $match:{
    //             _id:videoId
    //         }
    //     },
    //     {
    //         $lookup:{
    //             from:"coments",
    //             localField:"_id",
    //             foreignField:"video",
    //             as:"comments"
    //         }
    //     }
    // ])
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body
    const {videoId} = req.params

    if(!videoId){
        throw new apiError(400,"videoId can not be empty")
    }
    if(!content){
        throw new apiError(400,"comment can not be empty!")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"video not found")
    }
    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req?.user?._id
    })
    if(!comment){
        throw new apiError(500,"failed to add comment")
    }

    return res
    .status(200)
    .json(new apiResponse(
        201,comment,"comment added successfully"
    ))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} =  req.params
    const {newContent} =req.body

    if(!newContent){
        throw new apiError(400,"comment can not be empty")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new apiError(404,"cooment not found")
    }
    
    if(req?.user?._id.toString() !== comment?.owner.toString() ){
        throw new apiError(401,"only the owner of the comment can edit")
    }
    
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:newContent
            }
        },
        {
            new:true
        }
    )
    if(!updateComment){
        throw new apiError(500,"failed to update the comment")
    }
    return res
    .status(200)
    .json(new apiResponse(201,updateComment,"comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!commentId){
        throw new apiError(400,"commentId can not be empty")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new apiError(400,"comment does not exist")
    }
    if(comment.owner.toString()!== req?.user?._id.toString()){
        throw new apiError(401,"only the owner have the access to delete a comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(comment?._id)
    if(!deleteComment){
        throw new apiError(500,"failed to delete the comment")
    }

    return res
    .status(200)
    .json(new apiResponse(200,deleteComment,"comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}