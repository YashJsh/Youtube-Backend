
import type { Response } from "express";
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res : Response) => {
    return res
    .status(200)
    .json({status: "OK", message: "Healthcheck passed"});
})

export {
    healthcheck
}
    