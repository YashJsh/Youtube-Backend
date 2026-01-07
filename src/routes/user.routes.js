import { Router } from "express";
import { loginUser, logOutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verfiyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();


//userRouter.post("/register", registerUser);
userRouter.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]), 
    registerUser
);

userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verfiyJWT, logOutUser);

export default userRouter;