import { auth, db } from "../config/firebase.js";

export const requireAuth = async (req, res, next) => {
  // If Firebase Admin SDK is not initialized, check if we are in development and can bypass
  if (!auth) {
    if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
      console.warn("Bypassing auth check since Firebase Admin SDK is not configured. Attaching mock user.");
      req.user = {
        uid: "mock_user_123",
        email: "inspector.mock@inspectsafe.ai",
        name: "Mock Inspector"
      };
      return next();
    }
    return res.status(500).json({ error: "Authentication system is not configured on the server." });
  }

  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Access Denied: No authentication token provided." });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email.split("@")[0]
    };
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    res.status(401).json({ error: "Access Denied: Invalid or expired authentication token." });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Access Denied: Unauthorized." });
    }

    const { uid, email } = req.user;

    if (!db) {
      // Mock mode fallback check
      if (email === "umar2491812@gmail.com") {
        return next();
      }
      return res.status(403).json({ error: "Access Denied: Admin privileges required." });
    }

    // Live mode: Query Firestore dynamically to verify role is "Admin"
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data().role !== "Admin") {
      // Allow primary tester email bypass in case profile document wasn't fully created
      if (email === "umar2491812@gmail.com") {
        return next();
      }
      return res.status(403).json({ error: "Access Denied: Admin privileges required." });
    }

    next();
  } catch (error) {
    console.error("Error verifying admin state:", error);
    res.status(500).json({ error: "Internal authorization verification failed." });
  }
};
