import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.SECRET_KEY,
    { expiresIn: "1d" }
  );
};

const protect = async (req, res, next) => {
   try {
    let token;
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. If token is not found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // 4. Fetch complete user data from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }
    // 5. Attach complete user info to request object
    req.user = user;

    // 6. Continue to next middleware
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Role-based access control
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

export { protect, restrictTo, generateToken };
