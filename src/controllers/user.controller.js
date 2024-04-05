import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js"
import mongoose from "mongoose"

const registerUser = asyncHandler( async(req,res)=>{
    //get users details
    //validation and also check for empty data
    //check if user already exist
    //upoad with multer and then to clodinary for image and video
    //create an user object - entry in db
    //remove encrypted password and refresh token from response

    const {fullName, email, username,password} = req.body
    //console.log("email: ",email)
    if(
        [fullName,email,username,password].some((field)=>field?.trim ==="")
    ){
        throw new apiError(400,"all fields are requried")  
    }
    
    const isUserExist = await User.findOne({
        $or:[{ username },{ email }]
    })
    if(isUserExist){
        throw new apiError(409,"user already exists with this username or email")
    }

    //console.log("req files ",req.files)
    const avatraLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path 
    if(!avatraLocalPath){
        throw new apiError(400,"avatar is required")
    }
    const avatar = await uploadOnCloudinary(avatraLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new apiError(400,"avatar is required")
    }

    const user = await User.create({
        username:username.toLowerCase(),
        email,
        fullName,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new apiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse(200,createdUser,"user registered successfully")
    )
})

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new apiError(500,"something went wrong while generating access and refresh token")
    }

} 

const loginUser = asyncHandler(async (req,res)=>{
    //get username/email
    //find user
    //get password then validate the user
    const {username,email,password} = req.body
    if(!username && !email){
        throw new apiError(400,"username or email is requried")
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new apiError(400,"user does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password) 
    if(!isPasswordValid){
        throw new apiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new apiResponse(
                    200,
                    {
                        user:loggedInUser,accessToken,refreshToken
                    },
                    "user logged in successfully"
                )
            )
})

const logoutUser = asyncHandler(async(req,res)=>{
    console.log("username ",req.user)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            //$set:{refreshToken:undefined}
            $unset:{
                refreshToken:1 // by this we remove this field from db
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
            .clearCookie("accessToken",options)
            .clearCookie("refreshToken",options)
            .json(new apiResponse(200,{},"user logged out successfully"))
})

const refreshAccessToekn = asyncHandler(async(req,res)=>{
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incommingRefreshToken){
        throw new apiError(400,"unauthorized request")
    }
    const decodedToken = jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new apiError(401,"invalid refresh token")
    }
    if(incommingRefreshToken !== user.refreshToken){
        throw new apiError(401,"invalid refresh token")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(new apiResponse(200,{accessToken,refreshToken},"access token refreshed successfully"))

})

const changePassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new apiError(400,"invalid old password")
    }
    user.password = newPassword
    user.save({validateBeforeSave:false})
    return res.status(200)
            .json(new apiResponse(200,{},"password updated successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
            .json(new apiResponse(200,req.user,"current user fetched successfully"))
})

const changeAvatarImage = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new apiError(400,"avatar image missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new apiError(400,"failed to upload avatar image in cloudniary")
    }
    const deletePreviousImage = await deleteFromCloudinary(req.user.avatar)
    if(!deletePreviousImage){
        throw new apiError("failed to delete previosu image from clodinary")
    }
    const user = await User.findByIdAndUpdate(req.user._id,
                {
                    $set:{
                        avatar:avatar.url
                    }
                },
                {new:true}
            ).select("-password")

    return res.status(200)
            .json(new apiResponse(200,user,"avatar updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const username = req.params
    if(!username?.trim()){
        throw new apiError("invalid username")
    }

    //mongodb aggregate pipeline to find subscribersCount, subcribedTocount
    const channel = await User.aggregate([
        {
            $match:{
                username:username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subcriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subcriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subcribersCount:{
                    $size:"$subscribers"
                },
                subcribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubcribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                email:1,
                subcribedToCount:1,
                subcribersCount:1,
                avatar:1,
                isSubcribed:1
            }
        }
    ])

    if(!channel?.length){
        throw new apiError(404,"username does not exists")
    }
    console.log("channel ",channel[0])
    return res.status(200)
            .json(new apiResponse(200,channel[0],"user channel fetched successfully"))
})

const getWatchHistory= asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            },
            
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{  //check by writing it outside after data is fetched , for now it get stored inside owner as per project
                                    username:1,
                                    email:1
                                }
                            }
                        ]
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new apiResponse(200,user[0].watchHistory,"watch history fetched successfully"))
})

export {
    registerUser ,
    loginUser, 
    logoutUser, 
    refreshAccessToekn, 
    changePassword, 
    getCurrentUser, 
    changeAvatarImage, 
    getUserChannelProfile,
    getWatchHistory
}