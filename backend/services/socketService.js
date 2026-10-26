import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import dotenv from 'dotenv' 
dotenv.config()


class SocketService {
  io;
  activeUsers;

  constructor() {
    this.io = null;
    this.activeUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
            "https://taskme-eight.vercel.app"
          ], 
        credentials: true,     
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ['Content-Type',"Authorization"],          
      },
    });

    //middleware d'auth via cookie httpOnly
    this.io.use((socket, next) => {
      try {
        const rawCookie = socket.request.headers.cookie;

        if (!rawCookie) {
          return next(new Error("Cookie manquant"));
        }

        const cookies = cookie.parse(rawCookie);
        const token = cookies.jwt

        if (!token) {
          return next(new Error("JWT manquant"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.user?._id) {
          return next(new Error("JWT invalide"));
        }

        //attacher les infos utilisateur au socket
        socket.userId = decoded.user._id;
        socket.userRole = decoded.user.role;

        next();
      } catch (err) {
        console.error("Socket auth error:", err.message);
        next(new Error("JWT invalide ou expiré"));
      }
    });

    
    this.io.on("connection", (socket) => {
      console.log(`User connecté: ${socket.userId}`);

      this.activeUsers.set(socket.userId, socket.id);

      // Room dédiée par utilisateur
      socket.join(`user:${socket.userId}`);

      socket.emit("connected", {
        message: "Connecté aux notifications temps réel",
      });

      socket.on("disconnect", () => {
        console.log(`User déconnecté: ${socket.userId}`);
        this.activeUsers.delete(socket.userId);
      });
    });

    console.log("Socket.IO initialisé avec cookie HttpOnly");
  }

  //notification à un utilisateur
  sendToUser(userId, data) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit("notification:new", data);
  }

  //notification à plusieurs utilisateurs
  sendToMultipleUsers(userIds, data) {
    userIds.forEach((id) => this.sendToUser(id, data));
  }

  // verifie si un utilisateur est en ligne
  isUserOnline(userId) {
    return this.activeUsers.has(userId);
  }


  //envoye des emails 

  sendToUserAndEmail(userId, data) {

  this.sendToUser(userId, data);

  
  setTimeout(async () => {
    const user = await User.findById(userId);
    if (!user?.email) return;

    await emailService.sendEmail(
      user.email,
      data.title || "Nouvelle notification",
      `<p>${data.message || "Vous avez une nouvelle notification"}</p>`
    );
  }, 0);
}
}

export const socketService = new SocketService();
