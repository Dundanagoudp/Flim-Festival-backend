import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        enum: ["admin", "editor"],
        default: "editor",
        },
});
dotenv.config();

userSchema.pre("save",async function (next){
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
})
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.genearateToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN||"1d",
    });
  };
const User = mongoose.model("User", userSchema);
export default User;
