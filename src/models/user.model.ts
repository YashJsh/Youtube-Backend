import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";

export interface IUser extends Document {
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  avatar_id: string;
  coverImage?: string;
  cover_id?: string;
  watchHistory: mongoose.Types.ObjectId[];
  password: string;
  refreshToken?: string;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String, // Cloudinary url
      required: true,
    },
    avatar_id: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    cover_id: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);

});

userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  const payload = {
    _id: this._id,
    email: this.email,
  };
  const secret = process.env.ACCESS_TOKEN_SECRET!;
  const options = {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as string) || "1h",
  };
  console.log("Control reached access token");

  const token = jwt.sign(payload, secret, options as any);
  console.log(token);
  return token;
};

userSchema.methods.generateRefreshToken = function (): string {
  const payload = {
    _id: this._id,
    email : this.email,
  };
  const secret = process.env.REFRESH_TOKEN_SECRET!;
  const options = {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as string) || "7d",
  };

  return jwt.sign(payload, secret, options as any);
};

export const User = mongoose.model<IUser>("User", userSchema);
