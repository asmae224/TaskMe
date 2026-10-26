import express from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from 'http'

// Routes
import { router as userRouter } from './routes/userRoutes.js';
import { router as taskRouter } from './routes/taskRoutes.js';
import { router as affectationRouter} from './routes/AffectationRoutes.js'
import { historiqueRouter } from './routes/historiqueRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { socketService } from './services/socketService.js';
import { chatRouter } from './routes/ChatRoutes.js';
import { vehiculeRouter } from './routes/vehiculeRoutes.js'
import { checkDelegationExpirations } from './services/Expiration.js';
import { emailService } from './services/emailService.js';
import path from 'path';
import fs from 'fs'


// Charger variables d'environnement
dotenv.config();

const app = express();
const server = http.createServer(app);
// Connexion MongoDB 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongoose database connected successfully'))
  .catch((err) => console.log('Error connecting database: ' + err));

const uploadDir = path.join(process.cwd(), "uploads/tasks");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Dossier uploads/tasks créé !");
}



const allowedOrigins = ["https://taskme-eight.vercel.app"];

app.use(cors({
  origin: function(origin, callback){
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true
}));



//middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/tasks", express.static(uploadDir));

socketService.initialize(server)
global.io = socketService.io;


const API_URL = '/api';

// Routes
app.use(`${API_URL}`, userRouter);
app.use(`${API_URL}`, taskRouter);
app.use(`${API_URL}`, affectationRouter);
app.use(`${API_URL}`, historiqueRouter);
app.use(`${API_URL}/notifications`,notificationRouter)
app.use(`${API_URL}/chat`,chatRouter)
app.use(`${API_URL}/vehicles`, vehiculeRouter);


app.get('/', (req, res) => res.send('Hello World'));




setInterval(checkDelegationExpirations, 10 * 60 * 1000)


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

emailService.transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
})

