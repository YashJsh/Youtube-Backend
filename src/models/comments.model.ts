import mongoose,{ Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface IComments extends Document{
    content : string,
    videos : mongoose.Types.ObjectId,
    owner : mongoose.Types.ObjectId,
}

const commentSchema = new Schema<IComments>({
    content : {
        type : String,
        required : true,
    },
    videos : {
          type: Schema.Types.ObjectId,
          ref: "Video",
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
}, {
    timestamps : true
});

commentSchema.plugin(mongooseAggregatePaginate);

export const Comments = mongoose.model("Comments",commentSchema);