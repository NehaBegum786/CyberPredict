import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import dashboardRoutes  from "./routes/dashboard";
import graphRoutes      from "./routes/graph";
import forecastRoutes   from "./routes/forecast";
import uploadRoutes     from "./routes/upload";
import attackPathRoutes from "./routes/attackPath";
import explanationRoutes from "./routes/explanation";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || "http://localhost:3000";

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: [ALLOWED_ORIGIN, "http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "cyberpredict-backend",
    version: "1.0.0",
    demoMode: process.env.DEMO_MODE !== "false",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/dashboard",    dashboardRoutes);
app.use("/api/graph",        graphRoutes);
app.use("/api/forecast",     forecastRoutes);
app.use("/api/upload",       uploadRoutes);
app.use("/api/analyze",      uploadRoutes);          // alias
app.use("/api/attack-path",  attackPathRoutes);
app.use("/api/explanation",  explanationRoutes);
app.use("/api/alerts",       dashboardRoutes);       // alias

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "NotFound", message: "Route not found", statusCode: 404 });
});

// ─── Global error handler ────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[CyberPredict Backend Error]", err.message);
  res.status(500).json({ error: "InternalServerError", message: err.message, statusCode: 500 });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   CyberPredict Backend               ║
  ║   http://localhost:${PORT}             ║
  ║   Demo mode: ${process.env.DEMO_MODE !== "false" ? "ON  (MockPredictor)" : "OFF (ML service)"}     ║
  ╚═══════════════════════════════════════╝
  `);
});

export default app;
