import { createChallenge } from "altcha-lib";

/**
 * Generate CAPTCHA challenge
 * Endpoint: GET /api/v1/captcha/generate
 * Returns: { challenge, salt, algorithm, signature }
 */
export const generateCaptcha = async (req, res) => {
  try {
    const challenge = await createChallenge({
      hmacKey: process.env.ALTCHA_SECRET_KEY,
      algorithm: "SHA-256",
      maxNumber: 100000,
      saltLength: 12,
    });

    res.json({
      challenge: challenge.challenge,
      salt: challenge.salt,
      algorithm: challenge.algorithm,
      signature: challenge.signature,
    });
  } catch (error) {
    console.error("CAPTCHA generation error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating CAPTCHA",
    });
  }
};
