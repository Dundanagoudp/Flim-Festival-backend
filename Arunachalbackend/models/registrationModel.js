import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
       contacted: {
        type: Boolean,
        default: false, // initially not contacted
    }
});

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;