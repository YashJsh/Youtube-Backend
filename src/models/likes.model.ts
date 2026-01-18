import mongoose,{ Schema, Document } from "mongoose";

interface ILikes extends Document{
    comment : mongoose.Types.ObjectId,
    likedBy : mongoose.Types.ObjectId;
    video : mongoose.Types.ObjectId,
}

const likeSchema = new Schema<ILikes>({
    comment : {
        type : Schema.Types.ObjectId,
        ref : "Comment"
    },
    video : {
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
    likedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}, {
    timestamps : true
});



export const Like = mongoose.model("Like",likeSchema);