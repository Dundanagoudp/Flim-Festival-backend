import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/mongoConnect.js';
import cookieParser from 'cookie-parser';
import authRoute from './routes/authRoute.js';
import galleryRoute from './routes/galleryRoute.js';
import guestRoute from './routes/guestRoutes.js';
import awardsRoutes from './routes/awardsRoutes.js';
import eventRoutes from './routes/eventsRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import blogsRoute from './routes/blogsroute.js';

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL || "",
];
dotenv.config();
await connectDB();
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use("/api/v1/auth" ,authRoute)
app.use("/api/v1/gallery", galleryRoute)
app.use("/api/v1/guest", guestRoute)
app.use("/api/v1/blogs", blogsRoute)
app.use("/api/v1/awards", awardsRoutes)
app.use("/api/v1/events", eventRoutes)
// app.use("/api/v1/registration", registrationRoutes)
// app.use("/api/v1/submission", submissionRoutes)
 
app.get('/', (req, res) => {
    res.send('arunachal flim fetival backend is running')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
