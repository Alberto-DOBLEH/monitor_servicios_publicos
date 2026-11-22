const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const validateEnv = require("./src/config/validateEnv");
validateEnv();

const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const publicRoutes = require("./src/routes/publicRoutes");
const { limiteGlobal } = require("./src/middleware/rateLimiter");
const errorHandler = require("./src/middleware/errorHandler");
const pool = require("./src/config/db");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const frontendUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");

app.use(
  cors({
    origin: (origin, callback) => {
      // Flutter, curl y health checks no envían Origin.
      if (!origin) return callback(null, true);

      if (
        origin === "http://localhost:5173" ||
        origin === "http://localhost:3000" ||
        (frontendUrl && origin === frontendUrl) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Bloqueado por CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.use(limiteGlobal);

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de Monitoreo de Servicios Públicos - Los Mochis",
    version: "1.0.0",
    fase: "Fase 1 - Autenticación y roles",
    health: "/health",
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      db: "connected",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API de servicios públicos escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app;
