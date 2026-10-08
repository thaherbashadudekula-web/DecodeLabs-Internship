/**
 * Tasks Router (routes/tasks.js)
 *
 * Role in Request Flow:
 * - Handles HTTP requests for the /api/tasks resource endpoints.
 * - Follows strict RESTful design (nouns as paths, verbs as HTTP methods).
 * - Thin controller layer:
 *     1. Validates inputs via middleware (validateIdParam, validateTaskQuery, validateTaskCreate, validateTaskUpdate).
 *     2. Delegates data persistence to data/store.js.
 *     3. Chooses appropriate HTTP status code (200, 201, 204, 404).
 *     4. Returns structured JSON to the client.
 */

const express = require("express");
const router = express.Router();
const { tasks } = require("../data/store");
const {
  validateIdParam,
  validateTaskQuery,
  validateTaskCreate,
  validateTaskUpdate
} = require("../middleware/validate");

/**
 * GET /api/tasks
 * Retrieves all tasks, with optional ?status=open|done query filtering.
 * Responds: 200 OK
 */
router.get("/", validateTaskQuery, (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const taskList = tasks.getAll(filter);
  res.status(200).json(taskList);
});

/**
 * GET /api/tasks/:id
 * Retrieves a single task by ID.
 * Responds: 200 OK if found, 404 Not Found if missing.
 */
router.get("/:id", validateIdParam, (req, res) => {
  const task = tasks.getById(req.validatedId);

  if (!task) {
    return res.status(404).json({
      error: "Not Found",
      message: `Task with id ${req.validatedId} not found`
    });
  }

  res.status(200).json(task);
});

/**
 * POST /api/tasks
 * Creates a new task.
 * Responds: 201 Created with the new task payload.
 */
router.post("/", validateTaskCreate, (req, res) => {
  const createdTask = tasks.create(req.body);
  res.status(201).json(createdTask);
});

/**
 * PUT /api/tasks/:id
 * Updates an existing task by ID.
 * Responds: 200 OK with the updated task, or 404 Not Found if missing.
 */
router.put("/:id", validateIdParam, validateTaskUpdate, (req, res) => {
  const updatedTask = tasks.update(req.validatedId, req.body);

  if (!updatedTask) {
    return res.status(404).json({
      error: "Not Found",
      message: `Task with id ${req.validatedId} not found`
    });
  }

  res.status(200).json(updatedTask);
});

/**
 * DELETE /api/tasks/:id
 * Removes a task by ID.
 * Responds: 204 No Content on success, or 404 Not Found if missing.
 */
router.delete("/:id", validateIdParam, (req, res) => {
  const removed = tasks.remove(req.validatedId);

  if (!removed) {
    return res.status(404).json({
      error: "Not Found",
      message: `Task with id ${req.validatedId} not found`
    });
  }

  // 204 No Content indicates successful deletion with an empty response body
  res.status(204).send();
});

module.exports = router;
