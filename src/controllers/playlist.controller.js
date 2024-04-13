import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError, apiError} from "../utils/apiError.js"
import {ApiResponse, apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name || !description){
        throw new apiError(400,"name or description can not be empty")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist){
        throw new apiError(500,"some error occured while creating playlist")
    }

    return res
    .status(200)
    .json(new apiResponse(200,playlist,"Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const allPlaylists = await Playlist.aggregate([
        {
            $match:{
                owner:mongoose.Schema.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"owner",
                foreignField:"owner",
                as:"videos"
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                }
            }
        },
        {
            $project:{
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
            }
        }
    ])
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(500,"something went wrong while finding your playlist")
    }
    const allVideos = Playlist.aggregate([
        {
            $match:{
                _id:mongoose.Schema.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                },
                owner:{
                    $first:"$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                totalVideos: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    {
        throw new apiError(400,"not valid objectId of videoId or PlaylistId")
    }
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }
    if (!video) {
        throw new apiError(404, "video not found");
    }

    if((playlist.owner?.toString() && video.owner.toString()) !== req.user?._id.toString()) {
        throw new apiError(404,"only owner can add videos to thier playlist");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            updatedPlaylist,
            "Removed video from playlist successfully"
        )
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    {
        throw new apiError(400,"not valid objectId of videoId or PlaylistId")
    }
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }
    if (!video) {
        throw new apiError(404, "video not found");
    }

    if((playlist.owner?.toString() && video.owner.toString()) !== req.user?._id.toString()) {
        throw new apiError(
            404,
            "only owner can remove video from thier playlist"
        );
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            updatedPlaylist,
            "Removed video from playlist successfully"
        )
    );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId))
    {
        throw new apiError(400,"not valid objectId of videoId or PlaylistId")
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }
    if(playlist.owner?.toString()  !== req.user?._id.toString()) {
        throw new apiError(
            404,
            "only owner can remove thier playlist"
        );
    }
    await Playlist.findByIdAndDelete(playlistId)

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId))
    {
        throw new apiError(400,"not valid objectId of videoId or PlaylistId")
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }
    if(playlist.owner?.toString()  !== req.user?._id.toString()) {
        throw new apiError(
            404,
            "only owner can update thier playlist"
        );
    }
    const updatedPlaylist = Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {
            new:true,
        }
    )

    return res
    .status(200)
    .json(new apiResponse(200,updatedPlaylist,"playlist Updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}