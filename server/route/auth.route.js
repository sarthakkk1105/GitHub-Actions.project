import express from "express";
import { googleAuth } from "../controller/auth.controller.js";
import { logout } from "../controller/auth.controller.js";
const authRouter = express.Router();

authRouter.post("/google",googleAuth);
authRouter.post("/logout",logout);

export default authRouter;
