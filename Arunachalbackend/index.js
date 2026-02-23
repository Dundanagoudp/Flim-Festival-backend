import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/mongoConnect.js";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import { protect } from "./utils/auth.js";
import { getMyProfile } from "./controller/authController.js";
import galleryRoute from "./routes/galleryRoute.js";
import guestRoute from "./routes/guestRoutes.js";
import awardsRoutes from "./routes/awardsRoutes.js";
import eventRoutesV1 from "./routes/eventsRoutes1.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import blogsRoute from "./routes/blogsroute.js";
import aboutUsRoute from "./routes/aboutusRoute.js";
import videoBlogRoute from "./routes/videosRoutes.js";
import workshopRoute from "./routes/workshopRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import nominationsRoutes from "./routes/nominationRoutes.js";
import homepageRoutes from "./routes/HomepageRoutes.js";
import contactUsRoutes from "./routes/contactUsRoutes.js";
import captchaRoute from "./routes/captchaRoute.js";
import sessionPlanRoutes from "./routes/sessionPlanRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import heroBannerRoutes from "./routes/heroBannerRoutes.js";
import tickerAnnouncementRoutes from "./routes/tickerAnnouncementRoutes.js";
import Uploadrouter from "./routes/upload/upload.js";
import curatedRoutes from "./routes/curatedRoutes.js";
import rateLimit from "express-rate-limit";

// --- Config ---
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsPath = path.join(__dirname, "uploads");

const app = express();
const PORT = process.env.PORT || 5000;

const defaultOrigins = [
  "http://localhost:3000",
  "https://flimfestival.vercel.app",
  "https://arunachalfilmfestival.gully2global.in",
];
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .filter((o) => o !== "*")
  : [...defaultOrigins, process.env.FRONTEND_URL].filter(Boolean);

await connectDB();

// --- Security & CORS ---
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:7000", "http://192.168.1.21:7000"],
        mediaSrc: ["'self'", "data:", "https:", "http://localhost:7000", "http://192.168.1.21:7000"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", ...allowedOrigins],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        childSrc: ["'self'", "blob:", "data:"],
        workerSrc: ["'self'", "blob:"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

// Middleware to prevent duplicate CORS headers (must be before cors middleware)
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function (name, value) {
    if (name.toLowerCase() === "access-control-allow-origin") {
      const requestOrigin = req.get("Origin");
      if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
        return;
      }
      const existing = res.getHeader("Access-Control-Allow-Origin");
      if (existing) {
        if (typeof existing === "string" && existing.includes(",")) {
          const firstOrigin = existing.split(",")[0].trim();
          return originalSetHeader(name, firstOrigin);
        }
        if (existing === value) return;
        return originalSetHeader(name, value);
      }
    }
    return originalSetHeader(name, value);
  };
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Add Vary: Origin header to prevent cache poisoning
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

// Final cleanup middleware to ensure no duplicate CORS headers before response is sent
app.use((req, res, next) => {
  const cleanupCorsHeaders = () => {
    const originHeader = res.getHeader("Access-Control-Allow-Origin");
    if (originHeader && typeof originHeader === "string" && originHeader.includes(",")) {
      const firstOrigin = originHeader.split(",")[0].trim();
      res.setHeader("Access-Control-Allow-Origin", firstOrigin);
    }
  };
  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    cleanupCorsHeaders();
    return originalEnd(...args);
  };
  next();
});

// Additional security headers middleware (complementary to Helmet)
app.use((req, res, next) => {
  // Set proper Content-Type with charset for all responses
  if (res.getHeader("Content-Type") && !res.getHeader("Content-Type").includes("charset")) {
    const currentType = res.getHeader("Content-Type");
    if (currentType.includes("text/html") || currentType.includes("text/plain")) {
      res.setHeader("Content-Type", `${currentType}; charset=UTF-8`);
    }
  }

  // Additional security headers not covered by Helmet (allow video playback features)
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), autoplay=*, encrypted-media=*, fullscreen=*, picture-in-picture=*, publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), web-share=(), xr-spatial-tracking=()"
  );

  // Ensure X-XSS-Protection is set (Helmet sets this but we ensure it's correct)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  next();
});

// Middleware to ensure proper content type for JSON responses and cleanup CORS headers
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    // Clean up duplicate CORS headers before sending
    const originHeader = res.getHeader("Access-Control-Allow-Origin");
    if (originHeader && typeof originHeader === "string" && originHeader.includes(",")) {
      const firstOrigin = originHeader.split(",")[0].trim();
      res.setHeader("Access-Control-Allow-Origin", firstOrigin);
    }
    if (typeof data === "object" && !res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
    } else if (typeof data === "string" && !res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "text/plain; charset=UTF-8");
    }
    return originalSend.call(this, data);
  };
  next();
});

// --- Body & cookies ---
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.SECRET_KEY));

// HIGH PRIORITY FIX: Rate limiter for login endpoint
const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    success: false,
    message: "Too many login attempts from this IP. Please try again in 5 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
});

// --- Routes ---
app.use("/api/v1/auth/login", loginRateLimiter);
app.use("/api/v1/auth", authRoute);
app.get("/api/me", protect, getMyProfile);
app.use("/api/v1/gallery", galleryRoute);
app.use("/api/v1/guest", guestRoute);
app.use("/api/v1/blogs", blogsRoute);
app.use("/api/v1/awards", awardsRoutes);
app.use("/api/v1/events-schedule", eventRoutesV1);
app.use("/api/v1/registration", registrationRoutes);
app.use("/api/v1/submission", submissionRoutes);
app.use("/api/v1/aboutus", aboutUsRoute);
app.use("/api/v1/videos", videoBlogRoute);
app.use("/api/v1/workshop", workshopRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/nominations", nominationsRoutes);
app.use("/api/v1/homepage", homepageRoutes);
app.use("/api/v1/contactus", contactUsRoutes);
app.use("/api/v1/captcha", captchaRoute);
app.use("/api/v1/session-plans", sessionPlanRoutes);
app.use("/api/v1/pdfs", pdfRoutes);
app.use("/api/v1/hero-banner", heroBannerRoutes);
app.use("/api/v1/ticker-announcements", tickerAnnouncementRoutes);
app.use("/api/v1/curated", curatedRoutes);
app.use("/api/v1/uploads", Uploadrouter, express.static(uploadsPath));

app.get("/", (req, res) => {
  res.send("arunachal flim fetival backend is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
