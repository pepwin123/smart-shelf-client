import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";

import database from "./src/Config/MongoConnection.js";

import authRouter from "./src/Router/authRouter.js";
import bookRoutes from "./src/Router/books.js";
import searchRoutes from "./src/Router/search.js";
import shelfRouter from "./src/Router/shelfRoutes.js";
import workspaceRouter from "./src/Router/workspaceRouter.js";
import bookCacheRouter from "./src/Router/bookCacheRouter.js";
import activityLogRouter from "./src/Router/activityLogRouter.js";

import errorHandler from "./src/Middleware/errorMiddleware.js";
import { setupSocket } from "./src/Config/socket.js";

// Load .env located next to this file, regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

database();

app.use(express.json());
app.use(cors());

const io = new Server(server, {
  cors: { origin: "*" },
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
app.use("/api/books-cache", bookCacheRouter);
app.use("/api/shelves", shelfRouter);
app.use("/api/activity", activityLogRouter);
app.use("/api/workspaces", workspaceRouter);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
