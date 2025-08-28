import dotenv from "dotenv";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

dotenv.config();
let adminApp;

if (!getApps().length) {
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
} else {
  adminApp = getApp();
}

const storage = getStorage(adminApp);
const bucket = storage.bucket();

export { adminApp, storage, bucket };
