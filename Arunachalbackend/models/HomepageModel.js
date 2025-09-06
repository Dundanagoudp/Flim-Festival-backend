import mongoose from "mongoose";

const HomepageSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
}, { timestamps: true });

const Homepage = mongoose.model("Homepage", HomepageSchema);
export default Homepage;