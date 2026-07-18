import { db, auth } from "../config/firebase.js";

// Helper to get default profile fields
const getDefaultProfile = (uid, email, displayName) => ({
  uid,
  name: displayName || (email ? email.split("@")[0] : "Inspector"),
  email: email || "inspector@inspectsafe.ai",
  role: "Senior RICS Chartered Surveyor",
  organization: "InspectSafe UK Ltd",
  phone: "+44 (20) 7946 0192",
  location: "London, United Kingdom",
  photoURL: ""
});

// GET /api/user/profile
export const getUserProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const displayName = req.user.name;

    if (!db) {
      // Mock mode fallback
      return res.json(getDefaultProfile(uid, email, displayName));
    }

    const userDocRef = db.collection("users").doc(uid);
    const docSnapshot = await userDocRef.get();

    if (!docSnapshot.exists) {
      const defaultProfile = getDefaultProfile(uid, email, displayName);
      await userDocRef.set(defaultProfile);
      return res.json(defaultProfile);
    }

    const data = docSnapshot.data();
    return res.json(data);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile details" });
  }
};

// POST /api/user/profile
export const updateUserProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, phone, location, role, organization } = req.body;

    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name;
    if (phone !== undefined) updatedFields.phone = phone;
    if (location !== undefined) updatedFields.location = location;
    if (role !== undefined) updatedFields.role = role;
    if (organization !== undefined) updatedFields.organization = organization;

    if (!db) {
      // Mock mode success fallback
      return res.json({ message: "Profile updated successfully (Mock)", updated: updatedFields });
    }

    const userDocRef = db.collection("users").doc(uid);
    await userDocRef.set(updatedFields, { merge: true });

    // Also update Firebase Auth displayName if changed
    if (name && auth) {
      try {
        await auth.updateUser(uid, { displayName: name });
      } catch (authErr) {
        console.warn("Failed to sync displayName with Firebase Auth:", authErr);
      }
    }

    const docSnapshot = await userDocRef.get();
    return res.json(docSnapshot.data());
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile details" });
  }
};

// POST /api/user/avatar
export const uploadAvatar = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { avatarData } = req.body; // Expects "data:image/...;base64,..."

    if (!avatarData) {
      return res.status(400).json({ error: "No avatar image data provided." });
    }

    if (!db) {
      // Mock mode success fallback
      return res.json({ photoURL: avatarData });
    }

    const userDocRef = db.collection("users").doc(uid);
    await userDocRef.update({ photoURL: avatarData });

    return res.json({ photoURL: avatarData });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ error: "Failed to save avatar to profile" });
  }
};
