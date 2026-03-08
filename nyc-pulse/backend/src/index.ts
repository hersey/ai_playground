import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";

import eventsRouter from "./routes/events.js";
import showsRouter from "./routes/shows.js";
import preferencesRouter from "./routes/preferences.js";
import notificationsRouter from "./routes/notifications.js";
import { startScheduler } from "./services/scheduler.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(compression());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
  });
});

// API Routes
app.use("/api/events", eventsRouter);
app.use("/api/shows", showsRouter);
app.use("/api/preferences", preferencesRouter);
app.use("/api/notifications", notificationsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server] Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🗽 NYC Pulse API running at http://localhost:${PORT}
📡 Anthropic API: ${process.env.ANTHROPIC_API_KEY ? "✅ Configured" : "❌ Not configured (set ANTHROPIC_API_KEY)"}
🔔 Push Notifications: ${process.env.VAPID_PUBLIC_KEY ? "✅ Configured" : "⚠️  Not configured (set VAPID keys)"}
  `);

  // Start background scheduler
  startScheduler();
});

export default app;
