import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let db = null;
let auth = null;

try {
  let credential = null;

  // Option A: Load from Service Account JSON file path
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(serviceAccountPath)) {
      const rawData = fs.readFileSync(serviceAccountPath, "utf8");
      const serviceAccount = JSON.parse(rawData);
      credential = cert(serviceAccount);
      console.log("Firebase Admin SDK initialized using Service Account JSON file.");
    } else {
      console.log(`Firebase Service Account JSON file not found at: ${serviceAccountPath}. Checking env variables...`);
    }
  }

  // Option B: Load from individual Env Variables if Option A not resolved
  if (!credential && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    });
    console.log("Firebase Admin SDK initialized using Environment Variables.");
  }

  if (!credential) {
    console.warn("WARNING: Firebase Admin SDK credentials not configured in .env. Firestore and Auth endpoints will be bypassed or return mock data.");
  } else {
    initializeApp({
      credential
    });
    db = getFirestore();
    auth = getAuth();
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

export { db, auth };
