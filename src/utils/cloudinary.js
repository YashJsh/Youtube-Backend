import { v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    secure: true
});
console.log(cloudinary.config());


export const uploadImageCloudinary = async (localFilePath) => {
    const options = {
      use_filename: true,
      unique_filename: false,
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
  
