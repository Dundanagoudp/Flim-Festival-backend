import svgCaptcha from "svg-captcha-fixed";
import crypto from "crypto";

const captchaStore = new Map();

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

function cleanExpired() {
  const now = Date.now();
  for (const [id, entry] of captchaStore) {
    if (now > entry.expiresAt) captchaStore.delete(id);
  }
}

/**
 * GET /api/v1/captcha/generate
 * Returns { success, captchaId, svg }
 */
export const generateCaptcha = (req, res) => {
  try {
    cleanExpired();

    const captcha = svgCaptcha.create({
      size: 8,
      noise: 3,
      color: true,
      background: "#0a1628",
      width: 280,
      height: 60,
      fontSize: 45,
      ignoreChars: "0o1ilI",
    });

    const captchaId = crypto.randomUUID();

    captchaStore.set(captchaId, {
      answer: captcha.text,
      expiresAt: Date.now() + CAPTCHA_TTL_MS,
    });

    res.json({
      success: true,
      captchaId,
      svg: captcha.data,
    });
  } catch (error) {
    console.error("CAPTCHA generation error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating CAPTCHA",
    });
  }
};

/**
 * One-time verification — deletes entry after lookup.
 * @returns {boolean}
 */
export function verifyCaptcha(captchaId, userInput) {
  const entry = captchaStore.get(captchaId);
  if (!entry) return false;

  captchaStore.delete(captchaId);

  if (Date.now() > entry.expiresAt) return false;

  return entry.answer.toLowerCase() === String(userInput).toLowerCase();
}
