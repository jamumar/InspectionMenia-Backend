import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import reportRoutes from "./routes/reportRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import dropboxRoutes from "./routes/dropboxRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// HTTP Request Logger Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Global middlewares
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://inspetion-menia.vercel.app",
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : null
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // In development or if origin matches allowed list, permit access
    if (allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    // Fallback logic: allow any origin in dev if not matched explicitly
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from origin ' + origin;
    return callback(new Error(msg), false);
  },
  credentials: true
}));
app.use(express.json({ limit: "5mb" })); // Add limit to allow base64 uploads

// API Base Endpoints
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/", dropboxRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "healthy", message: "InspectSafe API backend is up and running" });
});

// Middleware for handling undefined routes (404)
app.use(notFound);

// Middleware for intercepting all application exceptions (500)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
