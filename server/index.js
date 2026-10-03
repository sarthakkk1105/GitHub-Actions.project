import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/connectdb.js";
import authRouter from "./route/auth.route.js";
import cookieparser from "cookie-parser";
import cors from "cors";
import userRouter from "./route/user.route.js";
import interviewRouter from "./route/interview.route.js";
import paymentRouter from "./route/payment.route.js";

dotenv.config();
const app = express();
app.use(cookieparser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
const PORT = process.env.PORT || 6000;


app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interview",interviewRouter)
app.use("/api/payment",paymentRouter)


app.get("/", (req, res) => {
     res.json({ message: "Hello from the server!" });
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    connectDB();
})