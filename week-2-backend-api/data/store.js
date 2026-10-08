/**
 * Data Layer (data/store.js)
 *
 * Role in Request Flow:
 * - Serves as an isolated, in-memory data store holding application state for
 *   "projects" and "tasks".
 * - Completely agnostic to the HTTP layer: does NOT interact with `req`, `res`,
 *   or HTTP status codes.
 * - Exposes standardized CRUD operations (getAll, getById, create, update, remove)
 *   so the storage engine can be cleanly swapped for a real database (PostgreSQL,
 *   MongoDB, etc.) in the future without modifying any route handlers.
 */

// In-memory data collections seeded with realistic starter records
let projects = [
  { id: 1, name: "Customer Portal Redesign", progress: 75 },
  { id: 2, name: "Mobile App v2.0", progress: 40 },
  { id: 3, name: "Cloud Infrastructure Migration", progress: 90 }
];

let tasks = [
  { id: 1, title: "Create Figma wireframes for dashboard", projectId: 1, status: "done", priority: "high" },
  { id: 2, title: "Implement OAuth2 social login", projectId: 2, status: "open", priority: "high" },
  { id: 3, title: "Setup automated CI/CD pipeline", projectId: 3, status: "done", priority: "medium" },
  { id: 4, title: "Optimize database queries for report generation", projectId: 1, status: "open", priority: "medium" },
  { id: 5, title: "Conduct user feedback interviews", projectId: 2, status: "open", priority: "low" }
];

// Auto-increment ID counters for new records
let nextProjectId = 4;
let nextTaskId = 6;

/**
 * Projects Store Operations
 */
const projectsStore = {
  /**
   * Retrieve all projects.
   * @returns {Array<Object>} List of projects (cloned to prevent external mutation)
   */
  getAll: () => {
    return projects.map(p => ({ ...p }));
  },

  /**
   * Retrieve a project by its numeric ID.
   * @param {number} id - Positive integer project ID
   * @returns {Object|null} The project object or null if not found
   */
  getById: (id) => {
    const project = projects.find(p => p.id === id);
    return project ? { ...project } : null;
  },

  /**
   * Create a new project.
   * @param {Object} projectData - Validated project payload { name, progress }
   * @returns {Object} The created project with auto-assigned id
   */
  create: ({ name, progress = 0 }) => {
    const newProject = {
      id: nextProjectId++,
      name: name.trim(),
      progress: Number(progress)
    };
    projects.push(newProject);
    return { ...newProject };
  },

  /**
   * Update an existing project by ID.
   * @param {number} id - Project ID to update
   * @param {Object} updates - Fields to update { name, progress }
   * @returns {Object|null} The updated project or null if not found
   */
  update: (id, updates) => {
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    if (updates.name !== undefined) {
      project.name = updates.name.trim();
    }
    if (updates.progress !== undefined) {
      project.progress = Number(updates.progress);
    }

    return { ...project };
  },

  /**
   * Remove a project and optionally cascade delete associated tasks.
   * @param {number} id - Project ID to remove
   * @returns {boolean} True if removed, false if not found
   */
  remove: (id) => {
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return false;

    // Delete project
    projects.splice(index, 1);

    // Cascade delete any tasks associated with this project
    tasks = tasks.filter(t => t.projectId !== id);

    return true;
  }
};

/**
 * Tasks Store Operations
 */
const tasksStore = {
  /**
   * Retrieve all tasks with optional filtering by status.
   * @param {Object} [filter] - Optional filter object { status: 'open' | 'done' }
   * @returns {Array<Object>} List of tasks
   */
  getAll: (filter = {}) => {
    let result = tasks;
    if (filter && filter.status) {
      const normalizedStatus = filter.status.toLowerCase();
      result = result.filter(t => t.status === normalizedStatus);
    }
    return result.map(t => ({ ...t }));
  },

  /**
   * Retrieve a task by its numeric ID.
   * @param {number} id - Positive integer task ID
   * @returns {Object|null} The task object or null if not found
   */
  getById: (id) => {
    const task = tasks.find(t => t.id === id);
    return task ? { ...task } : null;
  },

  /**
   * Retrieve all tasks belonging to a specific project.
   * @param {number} projectId - Positive integer project ID
   * @returns {Array<Object>} Tasks belonging to the project
   */
  getByProjectId: (projectId) => {
    return tasks
      .filter(t => t.projectId === projectId)
      .map(t => ({ ...t }));
  },

  /**
   * Create a new task.
   * @param {Object} taskData - Validated task payload { title, projectId, status, priority }
   * @returns {Object} The created task with auto-assigned id
   */
  create: ({ title, projectId, status = "open", priority = "medium" }) => {
    const newTask = {
      id: nextTaskId++,
      title: title.trim(),
      projectId: Number(projectId),
      status: status.toLowerCase(),
      priority: priority.toLowerCase()
    };
    tasks.push(newTask);
    return { ...newTask };
  },

  /**
   * Update an existing task by ID.
   * @param {number} id - Task ID to update
   * @param {Object} updates - Fields to update { title, projectId, status, priority }
   * @returns {Object|null} The updated task or null if not found
   */
  update: (id, updates) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    if (updates.title !== undefined) {
      task.title = updates.title.trim();
    }
    if (updates.projectId !== undefined) {
      task.projectId = Number(updates.projectId);
    }
    if (updates.status !== undefined) {
      task.status = updates.status.toLowerCase();
    }
    if (updates.priority !== undefined) {
      task.priority = updates.priority.toLowerCase();
    }

    return { ...task };
  },

  /**
   * Remove a task by ID.
   * @param {number} id - Task ID to remove
   * @returns {boolean} True if removed, false if not found
   */
  remove: (id) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    tasks.splice(index, 1);
    return true;
  }
};

module.exports = {
  projects: projectsStore,
  tasks: tasksStore
};
