import jwt from "jsonwebtoken";

export const genToken = async(userid) => {
    
    try {
        const token = jwt.sign({id:userid},process.env.JWT_SECRET,{expiresIn:"1d"});
        return token;
    } catch (error) {
        console.error("Error generating token", error);
        throw error;
    }
}
