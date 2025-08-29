import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectDB = async ()=>{
    try {
        console.log(process.env.MONGO_URI)
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 30000,
        });
        console.log("MongoDB connected successfully");
    }
    catch(err){
        console.error("mongoDB connection failed",err.message);
    }
}
export default connectDB;