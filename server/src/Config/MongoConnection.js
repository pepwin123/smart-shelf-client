import mongoose from "mongoose";

const dataBase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connection is Succesfull");
  } catch (err) {
    console.log("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default dataBase;
