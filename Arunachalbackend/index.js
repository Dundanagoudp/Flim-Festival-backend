import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/mongoConnect.js';
import cookieParser from 'cookie-parser';
import authRoute from './routes/authRoute.js';
import galleryRoute from './routes/galleryRoute.js';
import guestRoute from './routes/guestRoutes.js';
import awardsRoutes from './routes/awardsRoutes.js';
import eventRoutesV1 from './routes/eventsRoutes1.js';
import registrationRoutes from './routes/registrationRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import blogsRoute from './routes/blogsroute.js';
import aboutUsRoute from './routes/aboutusRoute.js';
import videoBlogRoute from './routes/videosRoutes.js';
import workshopRoute from './routes/workshopRoute.js';
import dashboardRoute from './routes/dashboardRoute.js';
import nominationsRoutes from './routes/nominationRoutes.js';
import homepageRoutes from './routes/HomepageRoutes.js';
import contactUsRoutes from './routes/contactUsRoutes.js';
import helmet from 'helmet';
import Uploadrouter from './routes/upload/upload.js';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000",
  "https://flimfestival.vercel.app",
  "https://arunachalfilmfestival.gully2global.in",
  process.env.FRONTEND_URL || "",
];
dotenv.config();
await connectDB();
app.disable('x-powered-by');
 
// Use Helmet for basic security headers
app.use(helmet({
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
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, 
  })
);

// Additional security headers middleware (complementary to Helmet)
app.use((req, res, next) => {
  // Set proper Content-Type with charset for all responses
  if (res.getHeader('Content-Type') && !res.getHeader('Content-Type').includes('charset')) {
    const currentType = res.getHeader('Content-Type');
    if (currentType.includes('text/html') || currentType.includes('text/plain')) {
      res.setHeader('Content-Type', `${currentType}; charset=UTF-8`);
    }
  }
 
  // Additional security headers not covered by Helmet (allow video playback features)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=*, encrypted-media=*, fullscreen=*, picture-in-picture=*, publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), web-share=(), xr-spatial-tracking=()');
 
  // Ensure X-XSS-Protection is set (Helmet sets this but we ensure it's correct)
  res.setHeader('X-XSS-Protection', '1; mode=block');
 
  next();
});
// Middleware to ensure proper content type for JSON responses
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data === 'object' && !res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    } else if (typeof data === 'string' && !res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    }
    return originalSend.call(this, data);
  };
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use("/api/v1/auth" ,authRoute)
app.use("/api/v1/gallery", galleryRoute)
app.use("/api/v1/guest", guestRoute)
app.use("/api/v1/blogs", blogsRoute)
app.use("/api/v1/awards", awardsRoutes)
app.use("/api/v1/events-schedule", eventRoutesV1)
app.use("/api/v1/registration", registrationRoutes)
app.use("/api/v1/submission", submissionRoutes)
app.use("/api/v1/aboutus", aboutUsRoute)
app.use("/api/v1/videos", videoBlogRoute)
app.use("/api/v1/workshop", workshopRoute)
app.use("/api/v1/dashboard", dashboardRoute)
app.use("/api/v1/nominations", nominationsRoutes)
app.use("/api/v1/homepage", homepageRoutes)

app.use("/api/v1/contactus", contactUsRoutes)
app.use("/uploads",Uploadrouter,express.static(path.join(process.cwd(), "uploads")));
 
app.get('/', (req, res) => {
    res.send('arunachal flim fetival backend is running')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})


// updated