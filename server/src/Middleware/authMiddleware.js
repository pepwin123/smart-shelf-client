import jwt from "jsonwebtoken";
import User from "../Models/authModel.js";

const auth = async (req, res, next) =>{
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({success: false, message: "No token provided"});

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if(!user) return res.status(401).json({success:false, message:"User is not found "});

        req.user=user;
        return next();
    } catch (error) {
        return res.status(500).json({success:false, message:"Server error", error: error.message});
    }
};

export default auth;