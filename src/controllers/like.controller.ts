import mongoose, { isValidObjectId, Schema } from "mongoose"

import { asyncHandler } from "../utils/asyncHandler.js"
import type { Request, Response } from "express";
import { Video } from "../models/video.model.js";
import { APIError } from "../utils/apiError.js";
import { Like } from "../models/likes.model.js";
import { APIresponse } from "../utils/apiResponse.js";

const toggleVideoLike = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const existingLike = await Like.findOne({
        video: new Schema.Types.ObjectId(videoId as string),
        likedBy: req.user._id
    });
    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new APIresponse(200, {}, "Liked Deleted Successfully"));
    }

    const like = await Like.create({
        video: new mongoose.Types.ObjectId(videoId as string),
        likedBy: req.user._id
    })
    return res.status(200).json(new APIresponse(200, like, "Liked Video Successfully"));

})

const toggleCommentLike = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params
    const existingLike = await Like.findOne({
        comment: new mongoose.Types.ObjectId(commentId as string),
        likedBy: req.user._id
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new APIresponse(200, {}, "Liked Deleted Successfully"));
    }

    const like = await Like.create({
        comment: new mongoose.Types.ObjectId(commentId as string),
        likedBy: req.user._id
    })
    return res.status(200).json(new APIresponse(200, like, "Liked Comment Successfully"));

})


const getLikedVideos = asyncHandler(async (req: Request, res: Response) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({ 
        likedBy: req.user._id, 
        video: { $ne: null } })
        .populate('video');
    return res
    .status(200)
    .json(new APIresponse(200, likedVideos, "Liked Videos Fetched Successfully"));
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}