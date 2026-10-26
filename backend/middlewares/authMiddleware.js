import jwt from "jsonwebtoken";
import {User} from "../models/userModel.js";
import dotenv from 'dotenv'
dotenv.config()

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt; 

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    req.user = user; // permet d'utiliser req.user dans les routes
    console.log('user from middleware ...',user);
    
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ message: "Token invalide" });
  }
};
