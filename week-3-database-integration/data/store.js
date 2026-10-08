/**
 * Persistent Data Layer (data/store.js)
 * DecodeLabs Full Stack Training - Project 3: Database Integration
 *
 * Role in Request Flow:
 * - Replaces the in-memory arrays from Project 2 with raw SQL queries executed
 *   against a persistent SQLite database (data/pulse.db) via `better-sqlite3`.
 * - Maintains identical function signatures (getAll, getById, create, update, remove)
 *   so route controllers and middleware require zero functional restructuring.
 * - Converts SQL database column names (e.g. project_id, created_at) into standard
 *   API camelCase properties (projectId, createdAt) to maintain exact response shapes.
 *
 * ============================================================================
 * SECURITY NOTE: Preventing SQL Injection
 * ============================================================================
 * SQL injection occurs when untrusted user input is directly concatenated or
 * interpolated into a SQL string. An attacker can break out of the literal data
 * context and execute arbitrary SQL instructions.
 *
 * Vulnerable Example (NEVER DO THIS):
 *   const sql = `UPDATE tasks SET title = '${updates.title}' WHERE id = ${id}`;
 *   // If updates.title is: "' OR 1=1; DROP TABLE tasks; --"
 *   // The executed SQL becomes:
 *   // UPDATE tasks SET title = '' OR 1=1; DROP TABLE tasks; --' WHERE id = 1;
 *   // -> This wipes out the entire tasks table!
 *
 * Safe Example (Used throughout this application):
 *   const stmt = db.prepare("UPDATE tasks SET title = ? WHERE id = ?");
 *   stmt.run(updates.title, id);
 *   // SQLite treats the ? placeholder as a literal value parameter.
 *   // Even if the input is "' OR 1=1 --", SQLite stores it as a literal string
 *   // title and NEVER parses it as SQL code.
 *
 * Dynamic Partial UPDATE Security:
 *   In partial updates, column names cannot use ? placeholders in SQL.
 *   To prevent injection, we validate every column against a strict, hardcoded
 *   whitelist of allowed column identifiers. User values are ALWAYS passed as
 *   bound parameters via ? placeholders.
 * ============================================================================
 */

const db = require("../db/database");

/**
 * Maps a SQLite projects table row to the API representation.
 * @param {Object|null} row - Database row object
 * @returns {Object|null} Formatted project object
 */
function mapProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    progress: row.progress,
    createdAt: row.created_at
  };
}

/**
 * Maps a SQLite tasks table row to the API representation.
 * Converts snake_case `project_id` and `created_at` to camelCase `projectId` and `createdAt`.
 * @param {Object|null} row - Database row object
 * @returns {Object|null} Formatted task object
 */
function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    projectId: row.project_id,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at
  };
}

/**
 * Projects Store Operations (backed by SQLite)
 */
const projectsStore = {
  /**
   * Retrieve all projects ordered by ID.
   * @returns {Array<Object>} List of project objects
   */
  getAll: () => {
    const stmt = db.prepare(`
      SELECT id, name, progress, created_at
      FROM projects
      ORDER BY id ASC
    `);
    const rows = stmt.all();
    return rows.map(mapProject);
  },

  /**
   * Retrieve a project by its numeric ID.
   * @param {number} id - Positive integer project ID
   * @returns {Object|null} Project object or null if not found
   */
  getById: (id) => {
    const stmt = db.prepare(`
      SELECT id, name, progress, created_at
      FROM projects
      WHERE id = ?
    `);
    const row = stmt.get(Number(id));
    return mapProject(row);
  },

  /**
   * Create a new project.
   * @param {Object} projectData - Validated project payload { name, progress }
   * @returns {Object} Newly created project row
   */
  create: ({ name, progress = 0 }) => {
    const stmt = db.prepare(`
      INSERT INTO projects (name, progress)
      VALUES (?, ?)
    `);
    const info = stmt.run(name.trim(), Number(progress));
    return projectsStore.getById(info.lastInsertRowid);
  },

  /**
   * Update an existing project by ID (supports partial updates).
   * @param {number} id - Project ID to update
   * @param {Object} updates - Fields to update { name, progress }
   * @returns {Object|null} Updated project object or null if not found
   */
  update: (id, updates) => {
    const existing = projectsStore.getById(id);
    if (!existing) return null;

    // Hardcoded whitelist of allowed updatable columns
    const allowedFields = {
      name: { col: "name", transform: (v) => v.trim() },
      progress: { col: "progress", transform: (v) => Number(v) }
    };

    const setClauses = [];
    const params = [];

    for (const [key, config] of Object.entries(allowedFields)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${config.col} = ?`);
        params.push(config.transform(updates[key]));
      }
    }

    // If no updatable fields provided, return existing record
    if (setClauses.length === 0) {
      return existing;
    }

    params.push(Number(id));
    const sql = `UPDATE projects SET ${setClauses.join(", ")} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...params);

    return projectsStore.getById(id);
  },

  /**
   * Remove a project and cascade delete all associated tasks.
   * @param {number} id - Project ID to remove
   * @returns {boolean} True if removed, false if not found
   */
  remove: (id) => {
    const stmt = db.prepare("DELETE FROM projects WHERE id = ?");
    const info = stmt.run(Number(id));
    // info.changes is > 0 if a row was deleted, 0 if no matching row existed
    return info.changes > 0;
  }
};

/**
 * Tasks Store Operations (backed by SQLite)
 */
const tasksStore = {
  /**
   * Retrieve all tasks with optional status filter.
   * @param {Object} [filter] - Optional filter object { status: 'open' | 'done' }
   * @returns {Array<Object>} List of task objects
   */
  getAll: (filter = {}) => {
    if (filter && filter.status) {
      const stmt = db.prepare(`
        SELECT id, title, project_id, status, priority, created_at
        FROM tasks
        WHERE status = ?
        ORDER BY id ASC
      `);
      const rows = stmt.all(filter.status.toLowerCase());
      return rows.map(mapTask);
    }

    const stmt = db.prepare(`
      SELECT id, title, project_id, status, priority, created_at
      FROM tasks
      ORDER BY id ASC
    `);
    const rows = stmt.all();
    return rows.map(mapTask);
  },

  /**
   * Retrieve a task by its numeric ID.
   * @param {number} id - Positive integer task ID
   * @returns {Object|null} Task object or null if not found
   */
  getById: (id) => {
    const stmt = db.prepare(`
      SELECT id, title, project_id, status, priority, created_at
      FROM tasks
      WHERE id = ?
    `);
    const row = stmt.get(Number(id));
    return mapTask(row);
  },

  /**
   * Retrieve all tasks belonging to a specific project.
   * @param {number} projectId - Positive integer project ID
   * @returns {Array<Object>} Tasks belonging to the project
   */
  getByProjectId: (projectId) => {
    const stmt = db.prepare(`
      SELECT id, title, project_id, status, priority, created_at
      FROM tasks
      WHERE project_id = ?
      ORDER BY id ASC
    `);
    const rows = stmt.all(Number(projectId));
    return rows.map(mapTask);
  },

  /**
   * Create a new task.
   * @param {Object} taskData - Validated payload { title, projectId, status, priority }
   * @returns {Object} Newly created task row
   */
  create: ({ title, projectId, status = "open", priority = "medium" }) => {
    const stmt = db.prepare(`
      INSERT INTO tasks (title, project_id, status, priority)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(
      title.trim(),
      Number(projectId),
      status.toLowerCase(),
      priority.toLowerCase()
    );
    return tasksStore.getById(info.lastInsertRowid);
  },

  /**
   * Update an existing task by ID (supports partial updates).
   * @param {number} id - Task ID to update
   * @param {Object} updates - Fields to update { title, projectId, status, priority }
   * @returns {Object|null} Updated task object or null if not found
   */
  update: (id, updates) => {
    const existing = tasksStore.getById(id);
    if (!existing) return null;

    // Hardcoded whitelist of allowed updatable columns
    const allowedFields = {
      title: { col: "title", transform: (v) => v.trim() },
      projectId: { col: "project_id", transform: (v) => Number(v) },
      status: { col: "status", transform: (v) => v.toLowerCase() },
      priority: { col: "priority", transform: (v) => v.toLowerCase() }
    };

    const setClauses = [];
    const params = [];

    for (const [key, config] of Object.entries(allowedFields)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${config.col} = ?`);
        params.push(config.transform(updates[key]));
      }
    }

    // If no updatable fields provided, return existing record
    if (setClauses.length === 0) {
      return existing;
    }

    params.push(Number(id));
    const sql = `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...params);

    return tasksStore.getById(id);
  },

  /**
   * Remove a task by ID.
   * @param {number} id - Task ID to remove
   * @returns {boolean} True if removed, false if not found
   */
  remove: (id) => {
    const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
    const info = stmt.run(Number(id));
    return info.changes > 0;
  }
};

module.exports = {
  projects: projectsStore,
  tasks: tasksStore
};
