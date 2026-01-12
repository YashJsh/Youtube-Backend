import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IVideo extends Document {
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  isPublished: boolean;
  owner: mongoose.Types.ObjectId;
}

const videoSchema = new Schema<IVideo>(
  {
    videoFile: {
      type: String, // Cloudinary URl
      required: true,
    },
    thumbnail: {
      type: String, // Cloudinary URl
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // From cloudinary
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model<IVideo>("Video", videoSchema);
