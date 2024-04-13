import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//not done 
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(isValidObjectId(channelId)){
        throw new apiError(400,"invalid object id of channelId")
    }
    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    { subscribed: false },
                    "unsunscribed successfully"
                )
            );
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                { subscribed: true },
                "subscribed successfully"
            )
        );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(isValidObjectId(channelId)){
        throw new apiError(400,"invalid object id of channelId")
    }
    const allSubscribers = Subscription.aggregate([
        {
            $match:mongoose.Schema.ObjectId(channelId)
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers"
            }
            
        },
        {
            $addFields:{
                totalSubscribers:{
                    $size:"$subscriber"
                }
            }
        }
    ])
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}