import { APIError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {
  deleteImageCloudinary,
  uploadImageCloudinary,
} from "../utils/cloudinary.js";
import { APIresponse } from "../utils/apiResponse.js";
import { createAccessAndRefreshToken } from "../utils/tokens.js";
import mongoose from "mongoose";
import { Request, Response } from "express";



export const registerUser = asyncHandler(
  async (req: Request<{}, {}, RegisterUserBody>, res: Response) => {
    const { fullName, email, username, password } = req.body;

    if (
      [fullName, email, username, password].some((field) => {
        return field?.trim() === "";
      })
    ) {
      throw new APIError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    console.log("Existed User is :", existedUser);

    if (existedUser) {
      throw new APIError(409, "User with email or username already exists");
    }

    console.log("Request files : ", req.files);
    const avatar_path = (req.files as any)?.avatar?.[0]?.path;
    let coverImagePath: string | undefined;

    if (
      req.files &&
      Array.isArray((req.files as any).coverImage) &&
      (req.files as any)?.coverImage.length > 0
    ) {
      coverImagePath = (req.files as any).coverImage[0].path;
    }

    if (!avatar_path) {
      throw new APIError(400, "Avatar file is required");
    }

    const avatar = await uploadImageCloudinary(avatar_path!);
    const coverImage = await uploadImageCloudinary(coverImagePath!);

    if (!avatar) {
      throw new APIError(400, "Avatar uploading problem");
    }

    console.log("Control reached after file upload");

    const user = await User.create({
      email,
      fullName,
      avatar: avatar.url,
      avatar_id: avatar.public_id,
      coverImage: coverImage?.url || "",
      cover_id: coverImage?.public_id || "",
      password,
      username: username.toLowerCase(),
    });

    console.log("User is : ", user);

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    console.log("created User ", createdUser);

    if (!createdUser) {
      throw new APIError(
        500,
        "Something went wrong while creating/registering user"
      );
    }

    return res
      .status(201)
      .json(new APIresponse(201, createdUser, "User registered successfully"));
  }
);

export const loginUser = asyncHandler(
  async (req: Request<{}, {}, LoginUserBody>, res: Response) => {
    const { email, username, password } = req.body;

    if (!(email || username)) {
      throw new APIError(400, "Email or username is required");
    }

    const user = await User.findOne({
      $or: [
        {
          username,
        },
        {
          email,
        },
      ],
    });
    console.log("User", user);

    if (!user) {
      throw new APIError(404, "User doesn't exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new APIError(401, "Invalid User credentials");
    }

    const { accessToken, refreshToken } = await createAccessAndRefreshToken(
      user._id.toString()
    );
    console.log(accessToken);
    console.log(refreshToken);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new APIresponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  }
);

export const logOutUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
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
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIresponse(200, {}, "User logged out successfully"));
});

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    return res
      .status(200)
      .json(new APIresponse(200, req.user, "User fetched successfully"));
  }
);

export const updateUserAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    const localPath = req.file?.path;
    if (!localPath) {
      throw new APIError(404, "Avatar file missing");
    }

    const prevAvatar = req.user?.avatar_id;

    const avatar = await uploadImageCloudinary(localPath);
    if (!avatar) {
      throw new APIError(400, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
          avatar_id: avatar.public_id,
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new APIError(500, "Error in updating user");
    }

    if (prevAvatar) {
      const del = await deleteImageCloudinary(prevAvatar);
      if (!del) {
        console.error("Error in deleting previous avatar");
      }
    }

    return res
      .status(200)
      .json(new APIresponse(200, user, "Avatar updated successfully"));
  }
);

export const updateCoverImage = asyncHandler(
  async (req: Request, res: Response) => {
    const localPath = req.file?.path;
    if (!localPath) {
      throw new APIError(404, "Cover file missing");
    }

    const coverId = req.user?.cover_id;

    const coverImage = await uploadImageCloudinary(localPath);
    if (!coverImage) {
      throw new APIError(400, "Error while uploading on Cover");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
          cover_id: coverImage.public_id,
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new APIError(500, "Error in updating user");
    }

    if (coverId) {
      const del = await deleteImageCloudinary(coverId);
      if (!del) {
        console.error("Error in deleting previous cover image");
      }
    }

    return res
      .status(200)
      .json(new APIresponse(200, user, "CoverImage updated successfully"));
  }
);

export const changeCurrentPassword = asyncHandler(
  async (req: Request<{}, {}, ChangePasswordBody>, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new APIError(400, "Both passwords are required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new APIError(404, "User not found");
    }

    const passwordCheck = await user.isPasswordCorrect(oldPassword);
    if (!passwordCheck) {
      throw new APIError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new APIresponse(200, {}, "Password Changed Successfully"));
  }
);

export const getUserChannelProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;
    const usernameStr = Array.isArray(username) ? username[0] : username;
    if (!usernameStr?.trim()) {
      throw new APIError(400, "username is missing");
    }

    const channel = await User.aggregate([
      {
        $match: {
          username: usernameStr?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: {
                $in: [req.user?._id, "$subscribers.subscriber"],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);

    console.log("channel : ", channel);
    if (!channel.length) {
      throw new APIError(404, "Channel doesn't exists");
    }

    return res
      .status(200)
      .json(
        new APIresponse(200, channel[0], "User channel Fetched Successfully")
      );
  }
);

export const getWatchHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user!._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      avatar: 1,
                      username: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
    ]);

    console.log(user);
    return res
      .status(200)
      .json(
        new APIresponse(
          200,
          user[0]?.watchHistory || [],
          "Watched history fetched successfully"
        )
      );
  }
);
