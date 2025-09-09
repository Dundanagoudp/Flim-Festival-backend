import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import {
  addVideoBlog,
  deleteVideoBlog,
  getRawVideo,
  getRawVideoById,
  getVideoBlog,
  getVideoBlogById,
  getYoutubeVideo,
  updateVideoBlog,
} from "../controller/videosController.js";

const videoBlogRoute = express.Router();

videoBlogRoute.post(
  "/addVideoBLog",
  protect,
  restrictTo("admin", "editor"),
  addVideoBlog
);
videoBlogRoute.get("/getVideoBlog", getVideoBlog);
videoBlogRoute.get("/getYoutubeVideo", getYoutubeVideo);
videoBlogRoute.get("/getuploadedVideo", getRawVideo);
videoBlogRoute.get("/getuploadedVideoById/:videoId", getRawVideoById);
videoBlogRoute.get("/getVideoById/:videoId", getVideoBlogById);
videoBlogRoute.put(
  "/updateVideo/:videoId",
  protect,
  restrictTo("admin", "editor"),
  updateVideoBlog
);
videoBlogRoute.delete(
  "/deleteVideo/:videoId",
  protect,
  restrictTo("admin"),
  deleteVideoBlog
);

export default videoBlogRoute;


