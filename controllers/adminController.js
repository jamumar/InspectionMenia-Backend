import { db, auth } from "../config/firebase.js";

// In-Memory fallback databases for Mock Mode
let mockUsers = [
  {
    uid: "mock_user_1",
    name: "Ava Thompson",
    email: "ava@company.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2 hours ago",
    access: "Full access",
    permissions: ["view_reports", "manage_users"],
    organization: "InspectSafe UK Ltd",
    phone: "+44 (20) 7946 0192",
    location: "London, United Kingdom"
  },
  {
    uid: "mock_user_2",
    name: "Marcus Lee",
    email: "marcus@company.com",
    role: "Manager",
    status: "Pending",
    lastLogin: "Yesterday",
    access: "Scoped access",
    permissions: ["view_reports"],
    organization: "InspectSafe UK Ltd",
    phone: "+44 (20) 7946 0194",
    location: "London, United Kingdom"
  },
  {
    uid: "mock_user_3",
    name: "Sofia Patel",
    email: "sofia@company.com",
    role: "Analyst",
    status: "Suspended",
    lastLogin: "3 days ago",
    access: "Restricted",
    permissions: [],
    organization: "InspectSafe UK Ltd",
    phone: "+44 (20) 7946 0196",
    location: "London, United Kingdom"
  }
];

let mockPasswordRequests = [
  {
    id: "req_1",
    name: "Ava Collins",
    email: "ava.collins@northstar.com",
    timestamp: "Today, 08:42 AM",
    status: "Pending",
    avatar: "AC"
  },
  {
    id: "req_2",
    name: "Jordan Miller",
    email: "jordan.miller@acme.io",
    timestamp: "Today, 07:18 AM",
    status: "Resolved",
    avatar: "JM"
  },
  {
    id: "req_3",
    name: "Sophia Reed",
    email: "sophia.reed@studio.dev",
    timestamp: "Yesterday, 11:05 PM",
    status: "Expired",
    avatar: "SR"
  }
];

// Helper: check if Firestore is available
const isDbActive = () => !!db;

// 1. GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    if (!isDbActive()) {
      return res.json(mockUsers);
    }

    const snapshot = await db.collection("users").get();
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    return res.json(users);
  } catch (error) {
    console.error("Admin: Failed to get users:", error);
    res.status(500).json({ error: "Failed to load users list." });
  }
};

// 2. POST /api/admin/users
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, organization, phone, location, permissions } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const userData = {
      name: name || email.split("@")[0],
      email,
      role: role || "Senior RICS Chartered Surveyor",
      status: "Active",
      lastLogin: "Never",
      access: role === "Admin" ? "Full access" : "Scoped access",
      permissions: permissions || ["view_reports"],
      organization: organization || "InspectSafe UK Ltd",
      phone: phone || "",
      location: location || "",
      photoURL: ""
    };

    if (!isDbActive()) {
      const mockUid = `mock_user_${Date.now()}`;
      const newMockUser = { uid: mockUid, ...userData };
      mockUsers.push(newMockUser);
      return res.status(201).json(newMockUser);
    }

    if (!auth) {
      return res.status(500).json({ error: "Firebase Authentication SDK is not configured." });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Save profile document in Firestore
    await db.collection("users").doc(userRecord.uid).set(userData);

    return res.status(201).json({ uid: userRecord.uid, ...userData });
  } catch (error) {
    console.error("Admin: Failed to create user:", error);
    const statusCode = error.code === "auth/email-already-exists" ? 400 : 500;
    return res.status(statusCode).json({ error: error.message || "Failed to create user account." });
  }
};

// 3. PUT /api/admin/users/:uid
export const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, role, status, permissions, phone, location, organization } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (role !== undefined) {
      updateFields.role = role;
      updateFields.access = role === "Admin" ? "Full access" : "Scoped access";
    }
    if (status !== undefined) updateFields.status = status;
    if (permissions !== undefined) updateFields.permissions = permissions;
    if (phone !== undefined) updateFields.phone = phone;
    if (location !== undefined) updateFields.location = location;
    if (organization !== undefined) updateFields.organization = organization;

    if (!isDbActive()) {
      const idx = mockUsers.findIndex((u) => u.uid === uid);
      if (idx === -1) return res.status(404).json({ error: "User not found" });
      mockUsers[idx] = { ...mockUsers[idx], ...updateFields };
      return res.json(mockUsers[idx]);
    }

    const userDocRef = db.collection("users").doc(uid);
    await userDocRef.set(updateFields, { merge: true });

    // Sync Auth displayName if name changed
    if (name && auth) {
      try {
        await auth.updateUser(uid, { displayName: name });
      } catch (authErr) {
        console.warn("Failed to sync displayName with Firebase Auth:", authErr);
      }
    }

    const doc = await userDocRef.get();
    return res.json({ uid, ...doc.data() });
  } catch (error) {
    console.error("Admin: Failed to update user:", error);
    res.status(500).json({ error: "Failed to update user account details." });
  }
};

// 4. PUT /api/admin/users/:uid/password
export const updateUserPassword = async (req, res) => {
  try {
    const { uid } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    if (!isDbActive()) {
      return res.json({ message: "Password updated successfully (Mock)" });
    }

    if (!auth) {
      return res.status(500).json({ error: "Firebase Authentication SDK is not configured." });
    }

    // Reset password in Firebase Auth
    await auth.updateUser(uid, { password });
    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Admin: Failed to reset password:", error);
    res.status(500).json({ error: error.message || "Failed to reset user password." });
  }
};

// 5. DELETE /api/admin/users/:uid
export const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!isDbActive()) {
      const idx = mockUsers.findIndex((u) => u.uid === uid);
      if (idx === -1) return res.status(404).json({ error: "User not found" });
      mockUsers.splice(idx, 1);
      return res.json({ message: "User deleted successfully (Mock)" });
    }

    // Delete from Firestore
    await db.collection("users").doc(uid).delete();

    // Delete connection credentials
    try {
      await db.collection("users").doc(uid).collection("connections").doc("dropbox").delete();
    } catch (e) {}

    // Delete from Firebase Auth
    if (auth) {
      try {
        await auth.deleteUser(uid);
      } catch (authErr) {
        console.warn("Failed to delete user from Firebase Auth:", authErr);
      }
    }

    return res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Admin: Failed to delete user:", error);
    res.status(500).json({ error: "Failed to delete user account." });
  }
};

// 6. GET /api/admin/password-requests
export const getPasswordRequests = async (req, res) => {
  try {
    if (!isDbActive()) {
      return res.json(mockPasswordRequests);
    }

    const snapshot = await db.collection("passwordRequests").orderBy("createdAt", "desc").get();
    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return res.json(requests);
  } catch (error) {
    console.error("Admin: Failed to get password requests:", error);
    res.status(500).json({ error: "Failed to load password requests." });
  }
};

// 7. POST /api/admin/password-requests/resolve
export const resolvePasswordRequest = async (req, res) => {
  try {
    const { requestId, action = "Resolved", newPassword } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required." });
    }

    if (!isDbActive()) {
      const idx = mockPasswordRequests.findIndex((r) => r.id === requestId);
      if (idx === -1) return res.status(404).json({ error: "Request not found" });
      mockPasswordRequests[idx].status = action;
      return res.json(mockPasswordRequests[idx]);
    }

    const docRef = db.collection("passwordRequests").doc(requestId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Password request not found." });
    }

    const reqData = doc.data();

    // If resetting password and password is provided, perform auth reset
    if (action === "Resolved" && newPassword && auth) {
      // Find the user email matching request
      try {
        const userRecord = await auth.getUserByEmail(reqData.email);
        await auth.updateUser(userRecord.uid, { password: newPassword });
        console.log(`Resolved: Updated password for email ${reqData.email}`);
      } catch (authErr) {
        console.warn("Could not sync password update for request:", authErr);
      }
    }

    await docRef.update({ status: action, resolvedAt: new Date().toISOString() });
    return res.json({ id: requestId, ...reqData, status: action });
  } catch (error) {
    console.error("Admin: Failed to resolve password request:", error);
    res.status(500).json({ error: "Failed to resolve password request." });
  }
};
