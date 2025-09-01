import dotenv from "dotenv";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

dotenv.config();

// Check if required environment variables exist
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY is missing in .env file");
  process.exit(1);
}

if (!process.env.FIREBASE_STORAGE_BUCKET) {
  console.error("❌ FIREBASE_STORAGE_BUCKET is missing in .env file");
  process.exit(1);
}

if (!process.env.FIREBASE_PROJECT_ID) {
  console.error("❌ FIREBASE_PROJECT_ID is missing in .env file");
  process.exit(1);
}

let adminApp;

if (!getApps().length) {
  try {
    const decodedServiceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString(
        "utf8"
      )
    );

    adminApp = initializeApp({
      credential: cert(decodedServiceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error.message);
    process.exit(1);
  }
} else {
  adminApp = getApp();
}

const storage = getStorage(adminApp);
const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

export { adminApp, storage, bucket };
