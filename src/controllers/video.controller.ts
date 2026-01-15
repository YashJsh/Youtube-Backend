import { skip } from "node:test";
import { Video } from "../models/video.model.js"
import { APIError } from "../utils/apiError.js"
import { APIresponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import type {Request, Response} from "express";
import { deleteImageCloudinary, uploadImageCloudinary, uploadVideoCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const videos = await Video.find(query)
    .sort({ createdAt: -1 })
    .skip((page-1)*limit)
    .limit(limit)

    const totalVideos = await Video.countDocuments();
    return res.status(200).json(new APIresponse(200, {page, limit, totalPages : Math.ceil(totalVideos/limit), totalVideos, videos}, "Video Fetched successfuly"))
});

const publishAVideo = asyncHandler(async (req : Request, res : Response) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video 
    const videoFile = (req.files as any).videoFile[0].path;
    const thumbnail = (req.files as any).thumbnail[0].path;
    if (!videoFile || !thumbnail){
        throw new APIError(404, "Video and thumbnail is required");
    };
    const VideoUpload = await uploadVideoCloudinary(videoFile);
    const ThumbnailUpload = await uploadImageCloudinary(thumbnail);

    const response = await Video.create({
        videoFile : VideoUpload.url,
        thumbnail : ThumbnailUpload.url,
        title,
        description,
        duration : VideoUpload.duration,
        isPublished : true
    });
    return res.status(201).json(new APIresponse(201, response, "Video Published Successfully"))
})

const getVideoById = asyncHandler(async (req : Request, res : Response) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId);
    if (!video){
        throw new APIError(404, "Video Not found")
    };
    return res.status(200).json(new APIresponse(200, video, "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req : Request, res : Response) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    if (!title || !description ){
        throw new APIError(400, "Title and description required")
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        title : title,
        description : description
    });
    if (!video){
        throw new APIError(404, "Video not found")
    }
    return res.status(200).json(new APIresponse(200, video));
});

const updateVideoThumbnail = asyncHandler(async (req : Request, res : Response)=>{
    const { videoId } = req.params
    const localPath = req.file?.path;
    if (!localPath) {
        throw new APIError(404, "Cover file missing");
    }
    const video = await Video.findById(videoId);
    if (!video){
        throw new APIError(404, "Video not found")
    }
    const thumbnail = video.thumbnail;
    const thumbnailUpload = await uploadImageCloudinary(localPath);
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        thumbnail : thumbnailUpload?.url
    });
    const removeFromCloudinary = await deleteImageCloudinary(thumbnail);    
    return res.status(200).json(new APIresponse(200, updatedVideo, "Thumbnail updated successfully"))
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    //deleting from cloudingary and database
    //First checking video exists
    const video = await Video.findById(videoId);
    if (!video){
        throw new APIError(404, "Video not found")
    };
    const url = video.videoFile;
    await Video.findByIdAndDelete(videoId);
    //Delete from cloudinary
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateVideoThumbnail
}