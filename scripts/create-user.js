import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load configuration
dotenv.config();

const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/firebase-service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Firebase Service Account JSON file not found at path: ${serviceAccountPath}`);
  process.exit(1);
}

// Initialize Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

const email = "umar2491812@gmail.com";
const password = "lockno88";
const displayName = "Umar";

async function run() {
  try {
    console.log(`Checking if user ${email} already exists...`);
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`User already exists (UID: ${userRecord.uid}). Updating password...`);
      userRecord = await auth.updateUser(userRecord.uid, {
        password: password,
        displayName: displayName
      });
      console.log("User details updated successfully!");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        console.log(`User not found. Creating user ${email}...`);
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: displayName,
          emailVerified: true
        });
        console.log(`User created successfully (UID: ${userRecord.uid})!`);
      } else {
        throw err;
      }
    }
    process.exit(0);
  } catch (error) {
    console.error("Failed to configure user account in Firebase:", error);
    process.exit(1);
  }
}

run();
