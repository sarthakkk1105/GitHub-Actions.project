
import User from "../models/user.model.js";
import { genToken } from "../config/token.js";
import jwt from "jsonwebtoken";

export const googleAuth = async (req, res) => {
   try{
        const {name,email} = req.body;
        let user = await User.findOne({ email });
        if(!user){
            user = new User({ name, email });
            await user.save();
        }

        const token = await genToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({ message: "User authenticated successfully", token,user });
   }catch(error) {
       console.error("Error in Google Auth", error);
       res.status(500).json({ message: "Internal Server Error" });
   }
}

export const logout = async (req, res) => {
    try {
        
       await res.clearCookie("token",{
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        path:"/",
       }); 
       
       return res.status(200).json({ message: "User logged out successfully" });
    }catch (error) {
        console.error("Error in logout", error);
        res.status(500).json({ message: "Internal Server Error" });
    }   
}