import {v2 as cloudinary} from "cloudinary"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const deleteFromCloudinary = async(filePath)=>{
   try {
     if(!filePath){
        return null
     }
     await cloudinary.uploader.destroy(filePath,(error)=>{
        if(error){
            return false;
        }
     })
     return true;
   } catch (error) {
        return null
   }
}

export {deleteFromCloudinary}