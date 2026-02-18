import { decryptData, decryptDataCBC } from "../utils/encryption.js";

const KEY_LEN_HEX = 64;

/**
 * Middleware: if req.body.encryptedBody is present, decrypt it (GCM then CBC)
 * and replace req.body with the parsed JSON. Otherwise pass through.
 * Requires express.json() to run first. Uses ENCRYPTION_KEY (64 hex chars) from env.
 */
export function decryptPayload(req, res, next) {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || typeof keyHex !== "string" || keyHex.length !== KEY_LEN_HEX || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    return next();
  }

  const encryptedBody = req.body?.encryptedBody;
  if (!encryptedBody || typeof encryptedBody !== "object" || encryptedBody.content == null || encryptedBody.iv == null) {
    return next();
  }

  const { content, iv } = encryptedBody;
  if (typeof content !== "string" || typeof iv !== "string") {
    return next();
  }

  let plainText;
  try {
    plainText = decryptData(content, iv, keyHex);
  } catch {
    try {
      plainText = decryptDataCBC(content, iv, keyHex);
    } catch {
      return res.status(400).json({ message: "Decryption failed" });
    }
  }

  try {
    req.body = JSON.parse(plainText);
  } catch {
    return res.status(400).json({ message: "Decryption failed: invalid JSON" });
  }
  next();
}
