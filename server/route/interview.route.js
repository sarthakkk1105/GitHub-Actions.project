import express from "express";
import isAuth from "../middleware/isAuth.js";
import { analyzeResume, finishInterview, generateQuestion, getInterviewReport, getMyInterview, submitAnswer } from "../controller/interview.controller.js";
import { upload } from "../middleware/multer.js";

const interviewRouter = express.Router();

interviewRouter.post("/resume",isAuth,upload.single("resume"),analyzeResume)
interviewRouter.post("/generate-questions",isAuth,generateQuestion)
interviewRouter.post("/submit-answer",isAuth,submitAnswer)
interviewRouter.post("/finish",isAuth,finishInterview)


interviewRouter.get("/get-interview",isAuth,getMyInterview)
interviewRouter.get("/report/:id",isAuth,getInterviewReport)



export default interviewRouter;