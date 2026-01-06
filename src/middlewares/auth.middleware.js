import jwt  from "jsonwebtoken";
import { APIError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";

export const verfiyJWT = asyncHandler(async(req, _, next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token){
        throw new APIError(401, "Unauthorized request");
    }
    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decoded?._id).select("-password -refreshToken");

    if (!user){
        throw new APIError(401, "Invalid access token")
    };

    req.user = user;
    next();
});