import express from "express";
import { generateCaptcha } from "../controller/captchaController.js";

const captchaRoute = express.Router();

// GET /api/v1/captcha/generate - Generate new CAPTCHA challenge
captchaRoute.get("/generate", generateCaptcha);

export default captchaRoute;
