import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler"
import { Comments } from "../models/comments.model"
import type { Request, Response } from "express"
import { APIresponse } from "../utils/apiResponse"
import { APIError } from "../utils/apiError"
import { Video } from "../models/video.model"
import { Schema } from "zod"


const getVideoComments = asyncHandler(async (req: Request, res: Response) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(videoId as string)) {
        throw new APIError(400, "Invalid videoId");
    }
    const Id = new mongoose.Types.ObjectId(videoId as string);
    const comments = await Comments.find({videos: Id})
        .populate("owner", "username")
        .skip((+page - 1) * +limit)
        .limit(+limit as number)
        .sort({ createdAt: -1 });

    if (!comments) {
        throw new APIError(404, "Comments not found");
    };

    const totatComments = await Comments.countDocuments({videos : Id});
    return res.status(200).json(new APIresponse(200, { page, limit, comments, totatComments}))
})

const addComment = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId as string)) {
        throw new APIError(400, "Invalid videoId");
    }
    const {comment} = req.body;
     //take comment from the body 
    if (!comment.trim()){
        throw new APIError(400, "Comment content is required");
    };
    //Find the video - check if video exists
    const video = await Video.findById(videoId);
    if (!video){
        throw new APIError(404, "Video not found");
    };

    //Create comment
    const response = await Comments.create({
        content : comment,
        videos : new mongoose.Types.ObjectId(videoId as string),
        owner : req.user._id
    })
    return res.status(201).json(new APIresponse(201, response, "comment created successfully"));
})

const updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId as string)) {
        throw new APIError(400, "Invalid CommentId");
    }
    const { comment } = req.body;
    if (!comment?.trim()){
        throw new APIError(400, "Comment is required");
    }
    const updatedComment = await Comments.findOneAndUpdate({_id : commentId, owner : req.user._id}, {
        content : comment.trim()
    }, {
      new: true, // return updated doc
    });

    if (!updateComment){
        throw new APIError(404, "Comment not found");
    }

    return res.status(200).json(new APIresponse(200, updatedComment, "Comment updated Successfully"))
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId as string)) {
        throw new APIError(400, "Invalid CommentId");
    }
   
    const deletedComment = await Comments.findOneAndDelete({_id : commentId, owner : req.user._id});

    if (!deletedComment){
        throw new APIError(404, "Comment not found or not authorized");
    }

    return res.status(200).json(new APIresponse(200, {}, "Comment Deleted Successfully"))
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}