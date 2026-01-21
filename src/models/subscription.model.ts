import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface ISubscription extends Document {
  subscriber: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.plugin(mongooseAggregatePaginate);

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);
