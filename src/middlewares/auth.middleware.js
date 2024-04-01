import  Jwt  from "jsonwebtoken";
import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const verifyJwt = asyncHandler(async(req,res)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new apiError(401,"unauthorized request")
        }
        const decodedToken = Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new apiError(401,"invalid token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new apiError(400,error?.message||" invalid token access")
    }
})