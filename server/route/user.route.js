import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getUser } from "../controller/user.controller.js";

const userRouter = express.Router();

userRouter.get("/getUser", isAuth, getUser);


export default userRouter;