import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logOutUser, 
    registerUser, 
    updateCoverImage, 
    updateUserAvatar
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verfiyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

//userRouter.post("/register", registerUser);
userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verfiyJWT, logOutUser);
userRouter.route("/change-passwrod").post(verfiyJWT, changeCurrentPassword);
userRouter.route("/curent-user").post(verfiyJWT, getCurrentUser);
userRouter.route("/update-avatar").patch(verfiyJWT, upload.single("avatar"), updateUserAvatar);
userRouter.route("/update-cover").patch(verfiyJWT, upload.single("cover"), updateCoverImage);
userRouter.route("/channel/:username").get(verfiyJWT, getUserChannelProfile);
userRouter.route("/watchHistory/:username").get(verfiyJWT, getWatchHistory);

export default userRouter;