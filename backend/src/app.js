import express from "express";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";

import eventsRoutes from "./routes/events.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import aiRoutes from "./routes/ai.routes.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

// ============================================================
// CORS CONFIGURATION
// ============================================================

// Production frontend URLs
const productionOrigins = [
  "https://eventhubapp.in",
  "https://www.eventhubapp.in",
];

// FRONTEND_URL from environment, if configured
if (env.frontendUrl) {
  const configuredOrigins = env.frontendUrl
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .map((url) => url.replace(/\/$/, ""));

  productionOrigins.push(...configuredOrigins);
}

// Local development URLs
const localOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
];

// Remove duplicates
const uniqueAllowedOrigins = [
  ...new Set([...productionOrigins, ...localOrigins]),
];

console.log("[CORS] Allowed origins:", uniqueAllowedOrigins);

// CORS middleware
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without Origin header
      // Example: curl / server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (uniqueAllowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn(
        `[CORS] Rejected origin: ${origin} | Allowed: ${uniqueAllowedOrigins.join(
          ", ",
        )}`,
      );

      return callback(new Error("CORS origin not allowed."));
    },

    credentials: false,

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ============================================================
// BODY PARSING
// ============================================================

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

// ============================================================
// LOGGING
// ============================================================

app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// ============================================================
// HEALTH / ROOT
// ============================================================

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "event-bulletin-board-backend",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "event-bulletin-board-backend",
    environment: env.nodeEnv,
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/events", eventsRoutes);

app.use("/api/events", registrationRoutes);

app.use("/api/events", questionsRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/uploads", uploadRoutes);

app.use("/api/ai", aiRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);

app.use(errorHandler);

// ============================================================
// EXPORT
// ============================================================

export default app;
