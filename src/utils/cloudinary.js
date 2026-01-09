import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    secure: true,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
});

console.log(cloudinary.config());

export const uploadImageCloudinary = async (localFilePath) => {
    const options = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
    };

    try {
      // Upload the image
      if (!localFilePath) return null;
      const result = await cloudinary.uploader.upload(localFilePath, options);
      console.log(result);
      return result;
    } catch (error) {
      console.error(error);
      fs.unlinkSync(localFilePath)
    }
};

export const deleteImageCloudinary = async (publicId) =>{
  try {
    const del = await cloudinary.uploader.destroy(publicId, {
      resource_type : "image"
    })
    return del;
  } catch (error) {
    console.error(error);
  }
}
  
