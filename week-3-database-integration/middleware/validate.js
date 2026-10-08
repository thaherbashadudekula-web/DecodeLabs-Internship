/**
 * Validation Middleware (middleware/validate.js)
 *
 * Role in Request Flow:
 * - Executes before any write (POST, PUT) or parameter access reaches the route handlers or store.
 * - Enforces the "Never Trust the Client" philosophy through two distinct passes:
 *     1. Syntactic Validation: Verifies required fields are present and of correct JS types.
 *     2. Semantic Validation: Verifies values make domain/business sense (ranges, allowed enums, existing references).
 * - Halts pipeline immediately with HTTP 400 Bad Request on failure:
 *     { "error": "Validation failed", "details": ["..."] }
 */

const { projects } = require("../data/store");

/**
 * Validates that the :id route parameter is a positive integer.
 */
function validateIdParam(req, res, next) {
  const idRaw = req.params.id;
  const details = [];

  // Syntactic check: Must be a non-empty string of digits
  if (!idRaw || !/^\d+$/.test(idRaw)) {
    details.push("Route parameter :id must be a positive integer");
  } else {
    // Semantic check: Positive integer (> 0)
    const idNum = Number(idRaw);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      details.push("Route parameter :id must be greater than 0");
    } else {
      req.validatedId = idNum;
    }
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details
    });
  }

  next();
}

/**
 * Validates optional query parameters for task listing (e.g. ?status=open|done).
 */
function validateTaskQuery(req, res, next) {
  const details = [];
  const { status } = req.query;

  if (status !== undefined) {
    const validStatuses = ["open", "done"];
    if (typeof status !== "string" || !validStatuses.includes(status.toLowerCase())) {
      details.push("Query parameter 'status' must be either 'open' or 'done'");
    }
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details
    });
  }

  next();
}

/**
 * Validates payload for creating a new Task (POST /api/tasks).
 */
function validateTaskCreate(req, res, next) {
  const details = [];
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["Request body must be a valid JSON object"]
    });
  }

  const { title, projectId, status, priority } = body;

  // PASS 1: Syntactic Validation (Presence and basic types)
  if (title === undefined || title === null) {
    details.push("title is required");
  } else if (typeof title !== "string") {
    details.push("title must be a string");
  } else if (title.trim().length === 0) {
    details.push("title must be a non-empty string");
  }

  if (projectId === undefined || projectId === null) {
    details.push("projectId is required");
  } else if (typeof projectId !== "number") {
    details.push("projectId must be a number");
  }

  if (status !== undefined && typeof status !== "string") {
    details.push("status must be a string");
  }

  if (priority !== undefined && typeof priority !== "string") {
    details.push("priority must be a string");
  }

  // PASS 2: Semantic Validation (Business logic & domain rules)
  if (typeof projectId === "number") {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      details.push("projectId must be a positive integer");
    } else {
      // Semantic check: Ensure referenced project exists in SQLite database
      const existingProject = projects.getById(projectId);
      if (!existingProject) {
        details.push("projectId does not reference an existing project");
      }
    }
  }

  if (typeof status === "string") {
    const validStatuses = ["open", "done"];
    if (!validStatuses.includes(status.toLowerCase())) {
      details.push("status must be either 'open' or 'done'");
    }
  }

  if (typeof priority === "string") {
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority.toLowerCase())) {
      details.push("priority must be one of: 'low', 'medium', 'high'");
    }
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details
    });
  }

  next();
}

/**
 * Validates payload for updating an existing Task (PUT /api/tasks/:id).
 */
function validateTaskUpdate(req, res, next) {
  const details = [];
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["Request body must be a valid JSON object"]
    });
  }

  const { title, projectId, status, priority } = body;
  const updateFields = [title, projectId, status, priority];

  // At least one valid updatable field must be supplied
  if (updateFields.every(field => field === undefined)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["Request body must contain at least one updatable field: title, projectId, status, priority"]
    });
  }

  // PASS 1: Syntactic Validation
  if (title !== undefined) {
    if (typeof title !== "string") {
      details.push("title must be a string");
    } else if (title.trim().length === 0) {
      details.push("title must be a non-empty string");
    }
  }

  if (projectId !== undefined) {
    if (typeof projectId !== "number") {
      details.push("projectId must be a number");
    }
  }

  if (status !== undefined) {
    if (typeof status !== "string") {
      details.push("status must be a string");
    }
  }

  if (priority !== undefined) {
    if (typeof priority !== "string") {
      details.push("priority must be a string");
    }
  }

  // PASS 2: Semantic Validation
  if (typeof projectId === "number") {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      details.push("projectId must be a positive integer");
    } else {
      // Semantic check: Ensure referenced project exists in SQLite database
      const existingProject = projects.getById(projectId);
      if (!existingProject) {
        details.push("projectId does not reference an existing project");
      }
    }
  }

  if (typeof status === "string") {
    const validStatuses = ["open", "done"];
    if (!validStatuses.includes(status.toLowerCase())) {
      details.push("status must be either 'open' or 'done'");
    }
  }

  if (typeof priority === "string") {
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority.toLowerCase())) {
      details.push("priority must be one of: 'low', 'medium', 'high'");
    }
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details
    });
  }

  next();
}

/**
 * Validates payload for creating a new Project (POST /api/projects).
 */
function validateProjectCreate(req, res, next) {
  const details = [];
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["Request body must be a valid JSON object"]
    });
  }

  const { name, progress } = body;

  // PASS 1: Syntactic Validation
  if (name === undefined || name === null) {
    details.push("name is required");
  } else if (typeof name !== "string") {
    details.push("name must be a string");
  } else if (name.trim().length === 0) {
    details.push("name must be a non-empty string");
  }

  if (progress !== undefined && progress !== null) {
    if (typeof progress !== "number") {
      details.push("progress must be a number");
    }
  }

  // PASS 2: Semantic Validation
  if (typeof progress === "number") {
    if (isNaN(progress) || progress < 0 || progress > 100) {
      details.push("progress must be a number between 0 and 100");
    }
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details
    });
  }

  next();
}

/**
 * Validates payload for updating an existing Project (PUT /api/projects/:id).
 */
function validateProjectUpdate(req, res, next) {
  const details = [];
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["Request body must be a valid JSON object"]
    });
  }

  const { name, progress } = body;

  if (name === undefined && progress === undefined) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["Request body must contain at least one updatable field: name, progress"]
    });
  }

  // PASS 1: Syntactic Validation
  if (name !== undefined) {
    if (typeof name !== "string") {
      details.push("name must be a string");
    } else if (name.trim().length === 0) {
      details.push("name must be a non-empty string");
    }
  }

  if (progress !== undefined) {
    if (typeof progress !== "number") {
      details.push("progress must be a number");
    }
  }

  // PASS 2: Semantic Validation
  if (typeof progress === "number") {
    if (isNaN(progress) || progress < 0 || progress > 100) {
      details.push("progress must be a number between 0 and 100");
    }
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details
    });
  }

  next();
}

module.exports = {
  validateIdParam,
  validateTaskQuery,
  validateTaskCreate,
  validateTaskUpdate,
  validateProjectCreate,
  validateProjectUpdate
};
