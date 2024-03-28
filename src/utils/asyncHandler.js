const asyncHandler = (reqHandler)=>{
    (req,res,next)=>{
        Promise.resolve(reqHandler(req,res,next)).catch((error)=>next(error))
    }
}

export {asyncHandler}