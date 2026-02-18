import crypto from "crypto";

const GCM_IV_LEN = 12;
const GCM_AUTH_TAG_LEN = 16;

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Base64 or hex encoded encrypted data (ciphertext + 16-byte auth tag)
 * @param {string} ivHex - Initialization vector in hex format (24 chars = 12 bytes for GCM)
 * @param {string} keyHex - Encryption key in hex format (64 chars = 32 bytes)
 * @returns {string} - Decrypted plain text
 */
export const decryptData = (encryptedData, ivHex, keyHex) => {
  try {
    const key = Buffer.from(keyHex, "hex");
    const iv = Buffer.from(ivHex, "hex");

    let encryptedBuffer;
    try {
      encryptedBuffer = Buffer.from(encryptedData, "base64");
    } catch {
      encryptedBuffer = Buffer.from(encryptedData, "hex");
    }

    const authTag = encryptedBuffer.subarray(-GCM_AUTH_TAG_LEN);
    const ciphertext = encryptedBuffer.subarray(0, -GCM_AUTH_TAG_LEN);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, { authTagLength: GCM_AUTH_TAG_LEN });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, null, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    throw new Error("Failed to decrypt data");
  }
};

/**
 * Decrypt data using AES-256-CBC (alternative for CryptoJS compatibility)
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} ivHex - Initialization vector in hex format
 * @param {string} keyHex - Encryption key in hex format (64 chars = 32 bytes)
 * @returns {string} - Decrypted plain text
 */
export const decryptDataCBC = (encryptedData, ivHex, keyHex) => {
  try {
    const key = Buffer.from(keyHex, "hex");
    const iv = Buffer.from(ivHex, "hex");

    const encryptedBuffer = Buffer.from(encryptedData, "base64");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption CBC error:", error.message);
    throw new Error("Failed to decrypt data (CBC mode)");
  }
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Plain text data to encrypt
 * @param {string} keyHex - Encryption key in hex format (64 chars = 32 bytes)
 * @returns {object} - Object containing encrypted data (base64) and IV (hex)
 */
export const encryptData = (data, keyHex) => {
  try {
    const key = Buffer.from(keyHex, "hex");
    const iv = crypto.randomBytes(GCM_IV_LEN);

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: GCM_AUTH_TAG_LEN });

    const enc = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const content = Buffer.concat([enc, authTag]);

    return {
      content: content.toString("base64"),
      iv: iv.toString("hex"),
    };
  } catch (error) {
    console.error("Encryption error:", error.message);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Generate a random 32-byte encryption key
 * @returns {string} - 64 character hex string (32 bytes)
 */
export const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString("hex");
};
