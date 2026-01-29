import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import database from "./src/Config/MongoConnection.js";
import authRouter from "./src/Router/authRouter.js";
import bookRoutes from "./src/Router/books.js";
import searchRoutes from "./src/Router/search.js";
import errorHandler from "./src/middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

database();

app.use(express.json());
app.use(cors());
app.use("/api/users", authRouter);
app.use("/api", searchRoutes);
app.use("/api", bookRoutes);

app.use(errorHandler);

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})