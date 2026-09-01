import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import healthRoutes from "./routes/health";
import eventRoutes from "./routes/eventRoutes";
import qaRoutes from "./routes/qaRoutes";
import aiRoutes from "./routes/aiRoutes";
import jobRoutes from "./routes/jobRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import profileRoutes from "./routes/profileRoutes";

dotenv.config();

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  "https://eventhubapp.in",
  "https://www.eventhubapp.in",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// CORS configuration
app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests without an Origin header
      // (curl, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow approved frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(`[CORS] Blocked origin: ${origin}`);

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Routes
app.use("/api", healthRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", qaRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);

export default app;