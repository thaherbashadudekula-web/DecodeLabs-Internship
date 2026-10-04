/**
 * Server Entry Point (server.js)
 *
 * Role in Request Flow:
 * - Boots and configures the Express application.
 * - Applies global middleware:
 *     - cors(): Enables Cross-Origin Resource Sharing so external frontend apps can connect.
 *     - express.json(): Parses incoming application/json request payloads.
 * - Mounts RESTful resource routers under /api/tasks and /api/projects.
 * - Provides system utility endpoint: GET /api/health.
 * - Registers catch-all 404 handler for unmatched routes.
 * - Registers centralized 4-argument error-handling middleware to intercept uncaught errors
 *   and prevent process crashes, returning HTTP 500.
 */

const express = require("express");
const cors = require("cors");

const tasksRouter = require("./routes/tasks");
const projectsRouter = require("./routes/projects");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. GLOBAL MIDDLEWARE
// ==========================================

// Enable CORS for cross-origin requests from frontend apps
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Request logger for visibility during development/training
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// ==========================================
// 2. HEALTH CHECK ENDPOINT
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Pulse API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`
  });
});

// ==========================================
// 3. RESOURCE ROUTERS
// ==========================================

// Mount resource routers under designated REST prefixes
app.use("/api/tasks", tasksRouter);
app.use("/api/projects", projectsRouter);

// ==========================================
// 4. UNMATCHED ROUTE HANDLER (404 CATCH-ALL)
// ==========================================

// Runs when no preceding route matches the incoming request
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} does not exist on this server`
  });
});

// ==========================================
// 5. CENTRALIZED ERROR HANDLING MIDDLEWARE
// ==========================================

// 4-argument signature (err, req, res, next) identifies this as an error-handler.
// Catches unhandled exceptions anywhere in the pipeline to prevent server crashes.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Centralized Error Handler caught:", err);

  // Handle malformed JSON body errors thrown by express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Bad Request",
      details: ["Malformed JSON syntax in request body"]
    });
  }

  // Generic 500 fallback for unexpected errors
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred on the server"
  });
});

// ==========================================
// 6. SERVER INITIALIZATION
// ==========================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  Pulse API Server is running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Tasks API:    http://localhost:${PORT}/api/tasks`);
    console.log(`  Projects API: http://localhost:${PORT}/api/projects`);
    console.log(`===============================================`);
  });
}

module.exports = app;
