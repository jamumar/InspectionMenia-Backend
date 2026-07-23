import axios from "axios";
import crypto from "crypto";
import { db, auth } from "../config/firebase.js";

const ALGORITHM = "aes-256-cbc";

// Local in-memory store for fallback in development when Firestore is not configured
const mockConnectionsDb = {};

// Helper: Get Encryption Key Buffer
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Development fallback key
    return crypto.createHash("sha256").update("inspectsafe-dev-encryption-key-pass").digest();
  }
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  return crypto.createHash("sha256").update(key).digest();
};

// Helper: Encrypt
const encrypt = (text) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

// Helper: Decrypt
const decrypt = (encryptedText) => {
  const key = getEncryptionKey();
  const [ivHex, encryptedHex] = encryptedText.split(":");
  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid cipher text format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// Helper: Swap refresh token for access token
const getAccessToken = async (refreshToken) => {
  const params = new URLSearchParams();
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");
  params.append("client_id", process.env.DROPBOX_APP_KEY || "mock_key");
  params.append("client_secret", process.env.DROPBOX_APP_SECRET || "mock_secret");

  const response = await axios.post("https://api.dropboxapi.com/oauth2/token", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data.access_token;
};

/**
 * 1. GET /auth/dropbox
 * Start OAuth flow. Supporting ?mode=login or ?mode=link&uid=xxx.
 */
export const redirectToDropbox = async (req, res, next) => {
  try {
    const { mode = "login", uid, origin } = req.query;

    if (mode === "link" && !uid) {
      return res.status(400).json({ error: "Missing required query parameter 'uid' for link mode" });
    }

    // Pack mode, uid, and origin into a state object
    const stateObj = {
      mode,
      uid: uid || null,
      origin: origin || null,
      timestamp: Date.now()
    };

    // Encrypt the state object to avoid CSRF and preserve context
    const state = encodeURIComponent(encrypt(JSON.stringify(stateObj)));
    
    const clientKey = process.env.DROPBOX_APP_KEY || "mock_client_key";
    const redirectUri = process.env.DROPBOX_REDIRECT_URI || "http://localhost:5000/auth/dropbox/callback";

    const authorizeUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientKey}&response_type=code&token_access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    res.redirect(authorizeUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /auth/dropbox/callback
 * Handle redirect from Dropbox.
 */
export const handleCallback = async (req, res, next) => {
  try {
    const { code, state, error: oauthError, error_description } = req.query;

    if (oauthError) {
      return res.status(400).send(`Dropbox OAuth Error: ${error_description || oauthError}`);
    }
    if (!code || !state) {
      return res.status(400).send("Missing authorization code or state token.");
    }

    // Recover the state object by decrypting the state token
    let stateObj;
    try {
      stateObj = JSON.parse(decrypt(decodeURIComponent(state)));
    } catch (err) {
      return res.status(400).send("Invalid OAuth state verification token.");
    }

    const { mode, uid: providedUid, origin: providedOrigin } = stateObj;

    // Exchange the Auth Code for tokens
    const redirectUri = process.env.DROPBOX_REDIRECT_URI || "http://localhost:5000/auth/dropbox/callback";
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("client_id", process.env.DROPBOX_APP_KEY || "mock_key");
    params.append("client_secret", process.env.DROPBOX_APP_SECRET || "mock_secret");
    params.append("redirect_uri", redirectUri);

    const tokenResponse = await axios.post("https://api.dropboxapi.com/oauth2/token", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const tokenData = tokenResponse.data;
    if (!tokenData.refresh_token) {
      return res.status(500).send("Dropbox did not return a refresh token. Make sure OAuth requested token_access_type=offline.");
    }

    // Fetch Dropbox user details
    const accountResponse = await axios.post(
      "https://api.dropboxapi.com/2/users/get_current_account",
      {},
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const account = accountResponse.data;
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);

    const connectionData = {
      refreshToken: encryptedRefreshToken,
      accountId: account.account_id,
      email: account.email,
      name: account.name.display_name,
      rootNamespace: account.root_info.root_namespace_id,
      linkedAt: new Date().toLocaleDateString(),
    };

    let targetUid = providedUid;
    let customToken = null;

    if (mode === "login") {
      // Direct Dropbox SSO: lookup/create Firebase Auth user based on Dropbox email
      if (auth) {
        try {
          const userRecord = await auth.getUserByEmail(account.email);
          targetUid = userRecord.uid;
          console.log(`Found existing Firebase User for Dropbox email ${account.email}: ${targetUid}`);
        } catch (err) {
          if (err.code === "auth/user-not-found") {
            const newUser = await auth.createUser({
              email: account.email,
              displayName: account.name.display_name,
              emailVerified: true
            });
            targetUid = newUser.uid;
            console.log(`Created new Firebase User for Dropbox email ${account.email}: ${targetUid}`);
          } else {
            throw err;
          }
        }
        // Generate Firebase custom token for this user
        customToken = await auth.createCustomToken(targetUid);
      } else {
        // Fallback mock tokens in development without Firebase keys
        targetUid = "mock_user_123";
        customToken = "mock_firebase_custom_token";
        console.warn("Bypassed Firebase lookup since Firebase Admin SDK is not configured.");
      }
    }

    // Save Dropbox credentials to connection document
    if (db) {
      await db.collection("users").doc(targetUid).collection("connections").doc("dropbox").set(connectionData);
      console.log(`Saved Dropbox connection in Firestore for uid: ${targetUid}`);
    } else {
      mockConnectionsDb[targetUid] = connectionData;
      console.warn(`Saved Dropbox connection in-memory for uid (No Firestore): ${targetUid}`);
    }

    const frontendUrl = providedOrigin || process.env.FRONTEND_URL || "http://localhost:5173";

    // Redirect user back to frontend
    if (mode === "login" && customToken) {
      res.redirect(`${frontendUrl.replace(/\/$/, "")}/?firebase_token=${customToken}`);
    } else {
      res.redirect(`${frontendUrl.replace(/\/$/, "")}/?dropbox=success`);
    }
  } catch (error) {
    console.error("Dropbox callback failed:", error.response?.data || error);
    res.status(500).send("Dropbox Authorization Failed.");
  }
};

/**
 * 3. GET /api/dropbox/me
 * Retrieve connected account status. Protected by requireAuth.
 */
export const getCurrentConnection = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    let docData = null;

    if (db) {
      const doc = await db.collection("users").doc(uid).collection("connections").doc("dropbox").get();
      if (doc.exists) {
        docData = doc.data();
      }
    } else {
      docData = mockConnectionsDb[uid];
    }

    if (!docData) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      name: docData.name,
      email: docData.email,
      linkedAt: docData.linkedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/dropbox/files
 * Fetch directory contents. Query parameters: ?path=/Interior
 */
export const listFiles = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const path = req.query.path || ""; // Default is root directory
    let docData = null;

    if (db) {
      const doc = await db.collection("users").doc(uid).collection("connections").doc("dropbox").get();
      if (doc.exists) {
        docData = doc.data();
      }
    } else {
      docData = mockConnectionsDb[uid];
    }

    if (!docData) {
      return res.status(401).json({ error: "Dropbox account is not connected." });
    }

    // Decrypt the refresh token
    const refreshToken = decrypt(docData.refreshToken);
    
    // Acquire temporary access token
    const accessToken = await getAccessToken(refreshToken);

    // Call Dropbox to list folder
    const response = await axios.post(
      "https://api.dropboxapi.com/2/files/list_folder",
      {
        path: path,
        recursive: false,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Dropbox-API-Path-Root": JSON.stringify({
            ".tag": "root",
            root: docData.rootNamespace,
          }),
        },
      }
    );

    res.json({
      success: true,
      entries: response.data.entries,
    });
  } catch (error) {
    console.error("Dropbox listFiles failed:", error.response?.data || error);
    res.status(500).json(error.response?.data || { error: "Failed to list folders from Dropbox" });
  }
};

/**
 * 5. POST /api/dropbox/disconnect
 * Disconnect/Unlink Dropbox account. Protected.
 */
export const disconnect = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    let disconnected = false;

    if (db) {
      await db.collection("users").doc(uid).collection("connections").doc("dropbox").delete();
      disconnected = true;
    } else {
      if (mockConnectionsDb[uid]) {
        delete mockConnectionsDb[uid];
        disconnected = true;
      }
    }

    res.json({
      success: disconnected,
      message: "Dropbox connection removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /api/dropbox/view
 * Fetch a direct temporary download link from Dropbox and redirect to it.
 */
export const viewFile = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: "Missing required query parameter: path" });
    }

    let docData = null;
    if (db) {
      const doc = await db.collection("users").doc(uid).collection("connections").doc("dropbox").get();
      if (doc.exists) {
        docData = doc.data();
      }
    } else {
      docData = mockConnectionsDb[uid];
    }

    if (!docData) {
      return res.status(401).json({ error: "Dropbox account is not connected." });
    }

    // Decrypt the refresh token
    const refreshToken = decrypt(docData.refreshToken);
    
    // Acquire temporary access token
    const accessToken = await getAccessToken(refreshToken);

    // Call Dropbox to get temporary link
    const response = await axios.post(
      "https://api.dropboxapi.com/2/files/get_temporary_link",
      {
        path: filePath,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Redirect the browser to the temporary link CDN url
    res.redirect(response.data.link);
  } catch (error) {
    console.error("Dropbox viewFile failed:", error.response?.data || error);
    res.status(500).json(error.response?.data || { error: "Failed to fetch file view link from Dropbox" });
  }
};
