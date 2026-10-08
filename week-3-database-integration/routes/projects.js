/**
 * Projects Router (routes/projects.js)
 *
 * Role in Request Flow:
 * - Handles HTTP requests for the /api/projects resource endpoints and nested tasks.
 * - Follows RESTful resource naming (nouns as paths, verbs as HTTP methods).
 * - Thin controller layer:
 *     1. Validates inputs via middleware (validateIdParam, validateProjectCreate, validateProjectUpdate).
 *     2. Delegates data persistence to data/store.js.
 *     3. Chooses appropriate HTTP status code (200, 201, 204, 404).
 *     4. Returns structured JSON to the client.
 */

const express = require("express");
const router = express.Router();
const { projects, tasks } = require("../data/store");
const {
  validateIdParam,
  validateProjectCreate,
  validateProjectUpdate
} = require("../middleware/validate");

/**
 * GET /api/projects
 * Retrieves all projects.
 * Responds: 200 OK
 */
router.get("/", (req, res, next) => {
  try {
    const projectList = projects.getAll();
    res.status(200).json(projectList);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id
 * Retrieves a single project by ID.
 * Responds: 200 OK if found, 404 Not Found if missing.
 */
router.get("/:id", validateIdParam, (req, res, next) => {
  try {
    const project = projects.getById(req.validatedId);

    if (!project) {
      return res.status(404).json({
        error: "Not Found",
        message: `Project with id ${req.validatedId} not found`
      });
    }

    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id/tasks
 * Retrieves all tasks belonging to a specific project.
 * Responds: 200 OK with tasks list, or 404 Not Found if the project doesn't exist.
 */
router.get("/:id/tasks", validateIdParam, (req, res, next) => {
  try {
    const project = projects.getById(req.validatedId);

    if (!project) {
      return res.status(404).json({
        error: "Not Found",
        message: `Project with id ${req.validatedId} not found`
      });
    }

    const projectTasks = tasks.getByProjectId(req.validatedId);
    res.status(200).json(projectTasks);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects
 * Creates a new project.
 * Responds: 201 Created with the new project payload.
 */
router.post("/", validateProjectCreate, (req, res, next) => {
  try {
    const createdProject = projects.create(req.body);
    res.status(201).json(createdProject);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/projects/:id
 * Updates an existing project by ID.
 * Responds: 200 OK with updated project, or 404 Not Found if missing.
 */
router.put("/:id", validateIdParam, validateProjectUpdate, (req, res, next) => {
  try {
    const updatedProject = projects.update(req.validatedId, req.body);

    if (!updatedProject) {
      return res.status(404).json({
        error: "Not Found",
        message: `Project with id ${req.validatedId} not found`
      });
    }

    res.status(200).json(updatedProject);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/projects/:id
 * Removes a project and its associated tasks.
 * Responds: 204 No Content on success, or 404 Not Found if missing.
 */
router.delete("/:id", validateIdParam, (req, res, next) => {
  try {
    const removed = projects.remove(req.validatedId);

    if (!removed) {
      return res.status(404).json({
        error: "Not Found",
        message: `Project with id ${req.validatedId} not found`
      });
    }

    // 204 No Content indicates successful deletion with an empty response body
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
