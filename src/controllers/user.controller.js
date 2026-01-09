import { APIError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { uploadImageCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/apiResponse.js";
import { createAcessAndRefreshToken } from "../utils/tokens.js";
import mongoose, { Mongoose } from "mongoose";

export const registerUser = asyncHandler(async (req, res) => {
    //get user details
    const { fullName, email, username, password } = req.body;
    //validation
    if (
        [fullName, email, username, password].some((filed) => {
            return filed?.trim() === ""
        })
    ) {
        throw new APIError(400, "All fields are required")
    }
    //check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    console.log("Existed User is :",existedUser);

    if (existedUser) {  
        throw new APIError(409, "User with email or username already exists")
    };
    //check for images

    console.log("Request files : ", req.files);
    const avatar_path = req.files?.avatar[0]?.path;
    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files?.coverImage.length > 0){
        coverImage = req.files.coverImage[0].path
    }

    //check for avatar
    if (!avatar_path) {
        throw new APIError(400, "Avatar file is required")
    };
    //upload them to cloudinary
    const avatar = await uploadImageCloudinary(avatar_path);
    const coverImage = await uploadImageCloudinary(coverImagePath);
    // check if avatar uploaded

    if (!avatar) {
        throw new APIError(400, "Avatar uploading problem")
    };

    console.log("Control reached after file upload");

    //creating user object - create entry in db
    const user = await User.create({
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase()
    })

    console.log("User is : ", user);

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id)
        .select(
            "-password -refreshToken"
        );
    console.log("created User ",createdUser);
    // check if response exists or not
    if (!createdUser) {
        throw new APIError(500, "Something went wrong while creating/registering user");
    };
    //sending response or send error
    return res.status(201).json(
        new APIresponse(201, createdUser, "User registered successfully")
    );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (
        !(email || username)
    ) {
        throw new APIError(400, "All fields are required")
    }


    //Validate body
    const user = await User.findOne({
        $or: [{
            username
        },
        {
            email
        }
        ]
    });
    console.log("User", user);
    //check user exists
    if (!user) {
        throw new APIError(404, "User doesn't exists")
    }
    //check password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new APIError(401, "Invalid User credentials")
    }
    //access and refresh token
    const { accessToken, refreshToken } = await createAcessAndRefreshToken(user._id);
    console.log(accessToken);
    console.log(refreshToken);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new APIresponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        ))
});

export const logOutUser = asyncHandler(async (req, res) => {
    //Remove refresh token
    //remove cookie
    const userId = req.user._id;
    await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new APIresponse(200, {}, "User logged out successfully"))
});

export const getCurrentUser = asyncHandler(async(req, res)=>{
    // const user = await User.findById(req.user?._id);
    // if (!user){
    //     throw new APIError(404, "User not found");
    // }
    return res.status(200).json(new APIresponse(200,
        req.user,
        "User fetched successfully"
    ));
});

export const updateUserAvatar = asyncHandler(async (req, res)=>{
    const localPath = req.file.path;
    if (!localPath){
        throw new APIError(404, "Aavatar file missing");
    }
    //Old avatar to be deleted from cloudinary

    const avatar = await uploadImageCloudinary(localPath);
    if (!avatar){
        throw new APIError(400, "Error while uploading on avatar");
    }

    //update avatar;
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set : {
            avatar : avatar.url
        }
    }, {new : true}).select("-password");

    if (!user){
        throw new Error(500, "Error in updating user")
    }
    

    return res.status(200).json(new APIresponse(200, user, "Avatar updated successfully"))
});

export const updateCoverImage = asyncHandler(async (req, res)=>{
    const localPath = req.file.path;
    if (!localPath){
        throw new APIError(404, "Cover file missing");
    }
    const coverImage = await uploadImageCloudinary(localPath);
    if (!coverImage){
        throw new APIError(400, "Error while uploading on Cover");
    }
    //update avatar;
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set : {
            coverImage : coverImage.url
        }
    }, {new : true}).select("-password");

    if (!user){
        throw new Error(500, "Error in updating user")
    }
    return res.status(200).json(new APIresponse(200, user, "CoverImage updated successfully"))
});

export const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const { oldPassword, newPassword} = req.body;
    if (!oldPassword || !newPassword){
        throw new APIError(400, "Both password are required");
    };
    const user = await User.findById(req.user?._id);
    const passwordCheck = await user.isPasswordCorrect(oldPassword);
    if(!passwordCheck){
        throw new APIError(400, "Invalid old password")
    };

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(200).json(new APIresponse(200, {}, "Password Changed Successfully"))
});

export const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const username = req.params;
    if (!username?.trim()){
        throw new APIError(400, "username is missing");
    };
    const channel = await User.aggregate([
        {   
            $match : {
                username : username?.toLowerCase()
            },
        },{
            $lookup : {
                from : "Subscription",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            },
        },{
            //Search and get
            $lookup : {
                from : "Subscription",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            },
        },{
            // Adds a field in the document
            $addFields : {
                subcribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $condition : {
                        if : {
                            $in : [req.user?._id, "$subscribers.subscriber"],
                        },
                        then : true,
                        else : false
                    }
                }
            }
        }, {
            //It gives like what we want from the final result
            $project : {
                fullName : 1,
                userName : 1,
                subscriberCount : 1,
                subscribedTo : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }
        }
    ]);

    console.log("channel : " , channel);
    if (!channel.length){
        throw new APIError(404, "Channel doesn't exists");
    }
    return res.status(200).json(new APIresponse(
        200,
        channel[0],
        "User channel Fetched Successfully"
    ));
});

const getWatchHistory =  asyncHandler (async(req, res)=>{
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            },
        },
        {
            $lookup : {
                from : "video",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watch_history",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id", 
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        avatar : 1,
                                        username : 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        },
        
    ]);

    console.log(user);
    return res.status(200).json(new APIresponse(200, user[0].watchHistory, "Watched history fetched successfully"))
});
