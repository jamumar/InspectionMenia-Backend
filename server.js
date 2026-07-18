import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import reportRoutes from "./routes/reportRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import dropboxRoutes from "./routes/dropboxRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// HTTP Request Logger Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Global middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Add limit to allow base64 uploads

// API Base Endpoints
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
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
