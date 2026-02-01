import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import http from "http";                     
import { Server } from "socket.io";          

import database from "./src/Config/MongoConnection.js";
import authRouter from "./src/Router/authRouter.js";
import bookRoutes from "./src/Router/books.js";
import searchRoutes from "./src/Router/search.js";
import errorHandler from "./src/Middleware/errorMiddleware.js";
import { setupSocket } from "./src/Config/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

const server = http.createServer(app);

database();

app.use(express.json());
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});

setupSocket(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/users", authRouter);
app.use("/api/search", searchRoutes);  
app.use("/api/books", bookRoutes);

app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
