import { Like } from "../models/likes.model.js";
import { Subscription } from "../models/subscription.model.js"
import { Video } from "../models/video.model.js";
import { APIresponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import type { Request, Response } from "express"


const getChannelStats = asyncHandler(async (req : Request, res : Response) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const [
  subsAggregate,
  videoAggregate,
  likesAggregate] = await Promise.all([
    Subscription.aggregate([
      {
        $match : {
          channel : req.user._id
        },
      },
      {
        $count : "totalSubscribers"
      }
    ]),
    Video.aggregate([
      {
        $match : {
          owner : req.user._id
        }
      },
      {
        $count : "totalVideos"
      }
    ]),
    Like.aggregate([
      {
        $match : {
          video : {
            $exists : true
          }
        }
      },
      {
        $lookup : {
          from : "videos",
          localField : "video",
          foreignField : "_id",
          as : "video"
        }
      },
      {
        $unwind : "$video"
      },
      {
        $match : {
          "video.owner" : req.user._id,
        }
      },
      {
        $count : "totalLikes"
      }
    ])
  ]);

  const totalSubscribers = subsAggregate[0]?.totalSubscribers || 0;
  const totalVideos = videoAggregate[0]?.totalVideos || 0;
  const totalLikes = likesAggregate[0]?.totalLikes || 0;

  return res.status(200).json(new APIresponse(200, {totalSubscribers, totalLikes, totalVideos}, "Data fetched successfully"))


});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
});

export {getChannelStats, getChannelVideos}
