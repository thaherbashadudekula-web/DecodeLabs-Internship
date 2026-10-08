/**
 * Database Seed Script (db/seed.js)
 * DecodeLabs Full Stack Training - Project 3: Database Integration
 *
 * Role in System:
 * - Populates the database with realistic starter projects and tasks.
 * - Idempotent: Only runs when the tables are empty, preventing accidental
 *   data duplication across server restarts.
 * - Uses a SQLite transaction to ensure atomic execution (all-or-nothing).
 */

const db = require("./database");

const STARTER_PROJECTS = [
  { id: 1, name: "Customer Portal Redesign", progress: 75 },
  { id: 2, name: "Mobile App v2.0", progress: 40 },
  { id: 3, name: "Cloud Infrastructure Migration", progress: 90 }
];

const STARTER_TASKS = [
  { id: 1, title: "Create Figma wireframes for dashboard", projectId: 1, status: "done", priority: "high" },
  { id: 2, title: "Implement OAuth2 social login", projectId: 2, status: "open", priority: "high" },
  { id: 3, title: "Setup automated CI/CD pipeline", projectId: 3, status: "done", priority: "medium" },
  { id: 4, title: "Optimize database queries for report generation", projectId: 1, status: "open", priority: "medium" },
  { id: 5, title: "Conduct user feedback interviews", projectId: 2, status: "open", priority: "low" }
];

/**
 * Seeds the database with starter projects and tasks.
 * @param {boolean} [force=false] - If true, skips the empty table check.
 * @returns {boolean} True if seeding occurred, false if skipped because tables were not empty.
 */
function seedDatabase(force = false) {
  const projectCountRow = db.prepare("SELECT count(*) AS count FROM projects").get();
  const taskCountRow = db.prepare("SELECT count(*) AS count FROM tasks").get();

  const isEmpty = projectCountRow.count === 0 && taskCountRow.count === 0;

  if (!isEmpty && !force) {
    console.log("[DB Seed] Database already contains records. Skipping seed to preserve persistent data.");
    return false;
  }

  console.log("[DB Seed] Seeding database with initial projects and tasks...");

  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, progress)
    VALUES (?, ?, ?)
  `);

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, project_id, status, priority)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Wrap seed insertions in a single transaction for atomicity and speed
  const runSeed = db.transaction(() => {
    if (force) {
      db.prepare("DELETE FROM tasks").run();
      db.prepare("DELETE FROM projects").run();
    }

    for (const proj of STARTER_PROJECTS) {
      insertProject.run(proj.id, proj.name, proj.progress);
    }

    for (const task of STARTER_TASKS) {
      insertTask.run(task.id, task.title, task.projectId, task.status, task.priority);
    }
  });

  runSeed();
  console.log(`[DB Seed] Successfully inserted ${STARTER_PROJECTS.length} projects and ${STARTER_TASKS.length} tasks.`);
  return true;
}

// Execute directly if run as a standalone script (e.g. `node db/seed.js`)
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  STARTER_PROJECTS,
  STARTER_TASKS
};
