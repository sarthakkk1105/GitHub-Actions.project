import dotenv from "dotenv";
import connectDB from "./config/connectdb.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    connectDB();
});