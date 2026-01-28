import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import database from "./src/Config/MongoConnection.js";
import authRouter from "./src/Router/authRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

database();

app.use(express.json());
app.use(cors());
app.use("/api/users", authRouter);

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})