import { User } from "../models/user.model.js";
import { APIError } from "./apiError.js";

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const createAccessAndRefreshToken = async (
  userId: string
): Promise<TokenResponse> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new APIError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({
      validateBeforeSave: false,
    });

    console.log("Control reached after,");
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong while generating access and refresh token",error
    );
  }
};
