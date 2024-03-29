import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler( async(req,res)=>{
    //get users details
    //validation and also check for empty data
    //check if user already exist
    //upoad with multer and then to clodinary for image and video
    //create an user object - entry in db
    //remove encrypted password and refresh token from response

    const {fullName, email, username,password} = req.body
    console.log("email: ",email)
    if(
        [fullName,email,username,password].some((field)=>field?.trim ==="")
    ){
        throw new apiError(400,"all fields are requried")  
    }
    
    const isUserExist = User.findOne({
        $or:[{ username },{ email }]
    })
    if(isUserExist){
        throw new apiError(409,"user already exists with this username or email")
    }

    const avatraLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
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

export {registerUser}