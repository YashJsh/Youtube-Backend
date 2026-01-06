import { User } from "../models/user.model";

export const createAcessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAcessToken;
        const refreshToken = user.generateRefreshToken;
        user.refreshToken = refreshToken;
        await user.save({
            validateBeforeSave : false
        });
        return {
            accessToken, refreshToken
        }
    } catch (error) {
        throw new APIError(500, "Something went wrong while generating access and refresh token");
    }
};

