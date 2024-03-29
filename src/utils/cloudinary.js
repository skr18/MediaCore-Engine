import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async(localFilePath)=>{
  try {
    if(!localFilePath){
      return null
    }
    const fileUploadResponse = await cloudinary.uploader.upload(localFilePath,{
      resource_type:"auto"
    })
    console.log("file uploaded successfully ",fileUploadResponse.url)
    return fileUploadResponse
  } catch (error) {
    //if any error occured while uploading the file to clodinary we need to remove the file from
    // the local server also so we unlink the file from the local server
    fs.unlinkSync(localFilePath)
    return null
  }
}

export {uploadOnCloudinary}