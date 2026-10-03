import jwt from "jsonwebtoken";
const isAuth = async (req, res, next) => {
    try{
        let { token } = req.cookies;
        if(!token){
            return res.status(401).json({ message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({ message: "Invalid token" });
        }
        req.userId = decoded.id;
        next();
        
    }catch(error){
        return res.status(401).json({ message: "Invalid token" });
    }
}
export default isAuth;