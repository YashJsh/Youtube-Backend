import { APIError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User }  from "../models/user.model.js"
import { uploadImageCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/apiResponse.js";

export const registerUser = asyncHandler(async (req, res)=>{
    //get user details
    const {fullName, email, username, password} = req.body;
    //validation
    if (
        [fullName, email, username, password].some((filed)=>{
            return filed?.trim() === ""
        })
    ) {
        throw new APIError(400, "All fields are required")
    }
    //check if user already exists
    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if (existedUser){
        throw new APIError(409, "User with email or username already exists")
    };
     //check for images

    console.log("Request files : ",req.files);
    const avatar_path = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;
    //check for avatar
    if (!avatar_path){
        throw new APIError(400, "Avatar file is required")
    };
    //upload them to cloudinary
    const avatar = await uploadImageCloudinary(avatar_path);
    const coverImage = await uploadImageCloudinary(coverImagePath);
    // check if avatar uploaded

    if (!avatar){
        throw new APIError(400, "Avatar uploading problem")
    };

    //creating user object - create entry in db
    const user = await User.create({
        email,
        fullName, 
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        password, 
        username : username.toLowerCase()
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id)
    .select(
        "-password -refreshToken"
    )
    // check if response exists or not
    if (!createdUser){
        throw new APIError(500, "Something went wrong while creating/registering user");
    };
    //sending response or send error
    return res.status(201).json(
        new APIresponse(201, createdUser, "User registered successfully")
    );
}); 