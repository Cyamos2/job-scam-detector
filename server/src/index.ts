// server/src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import * as Sentry from "@sentry/node";
import { prisma } from "./prisma.js";
import jobsRouter from "./routes/jobs.js";
import verifyRouter from "./routes/verify.js";
import whoisRouter from "./routes/whois.js";
import { errorHandler, notFoundHandler, setupUnhandledRejectionHandler, setupUncaughtExceptionHandler } from "./middleware/errorHandler.js";
import { securityHeaders, corsOptions, requestIdMiddleware, securityLogging, validateContentType } from "./middleware/security.js";
import { apiRateLimiter, whoisRateLimiter } from "./middleware/rateLimiter.js";
import { logger } from "./utils/logger.js";

const app = express();

// Initialize Sentry for error tracking
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    debug: process.env.NODE_ENV !== "production",
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
    ],
  });

  // Request handler for Sentry
  app.use(Sentry.Handlers.requestHandler({
    request: ["headers", "method", "url", "query"],
  }));
}

// Trust proxy (for production behind load balancer)
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Middleware
app.use(express.json({ limit: "10kb" })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// CORS configuration
app.use(cors(corsOptions));

// Security headers
app.use(securityHeaders);

// Request ID for tracing
app.use(requestIdMiddleware);

// Content type validation
app.use(validateContentType);

// HTTP request logging (Morgan)
app.use(morgan("combined", {
  stream: {
    write: (message: string) => {
      const parts = message.trim().split(" ");
      logger.httpRequest(
        parts[0] || "UNKNOWN",
        parts[1] || "UNKNOWN",
        parseInt(parts[2]) || 200,
        parseFloat(parts[3]) || 0,
      );
    },
  },
}));

// Security logging
app.use(securityLogging);

// Health check (no rate limiting)
app.get("/health", async (_req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    logger.error("Health check failed", { error: String(error) });
    res.status(503).json({
      success: false,
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

// API info endpoint
app.get("/api", (_req: Request, res: Response) => {
  res.json({
    success: true,
    name: "Scamicide API",
    version: "1.0.0",
    description: "Job scam detection API",
    endpoints: {
      jobs: "/api/v1/jobs",
      verify: "/api/v1/verify",
      whois: "/api/v1/whois",
    },
  });
});

// Rate limiting
app.use("/api", apiRateLimiter);
app.use("/api/v1/whois", whoisRateLimiter);

// API Routes with /api/v1 prefix
app.use("/api/v1/jobs", jobsRouter);
app.use("/api/v1/verify", verifyRouter);
app.use("/api/v1/whois", whoisRouter);

// Sentry error handler (must be after routes)
if (sentryDsn) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Setup unhandled rejection handlers
setupUnhandledRejectionHandler();
setupUncaughtExceptionHandler();

// Server listen
const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 3000);

const server = app.listen(PORT, HOST, () => {
  logger.info("Server started", {
    host: HOST,
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    pid: process.pid,
  });
  console.info(`🚀 API listening at http://${HOST}:${PORT}`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info("HTTP server closed");

    // Close database connection
    prisma.$disconnect()
      .then(() => {
        logger.info("Database connection closed");
        process.exit(0);
      })
      .catch((error) => {
        logger.error("Error closing database connection", { error: String(error) });
        process.exit(1);
      });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;

