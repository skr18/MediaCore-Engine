import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const content = req.body();
    if(!content){
        throw new apiError(400,"content can not be empty")
    }

    const tweet = await Tweet.create({
        content,
        owner:req.user?._id
    })
    if (!tweet) {
        throw new apiError(500, "failed to create tweet please try again");
    }

    return res
        .status(200)
        .json(new apiResponse(200, tweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.params
    if(!isValidObjectId(userId)){
        throw new apiError(400,"userId is not valid")
    }
    const tweets = Tweet.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            "avatar.url":1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likes",
                pipeline:{
                    $project:{
                        likedBy:1
                    }
                }
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likeDetails"
                },
                isLikedByUser:{
                    $cond:{
                        if:{$in:[req.user?._id,"$likeDetails.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLikedByUser: 1
            },
        },

    ])
    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content) {
        throw new apiError(400, "content is required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new apiError(400, "only owner can edit thier tweet");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!newTweet) {
        throw new apiError(500, "Failed to edit tweet please try again");
    }

    return res
        .status(200)
        .json(new apiResponse(200, newTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new apiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new apiError(400, "only owner can delete thier tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(new ApiResponse(200,{}, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}