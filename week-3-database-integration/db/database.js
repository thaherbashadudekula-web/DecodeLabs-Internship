/**
 * Database Connection & Initialization (db/database.js)
 * DecodeLabs Full Stack Training - Project 3: Database Integration
 *
 * Role in System:
 * - Initializes the SQLite persistent connection using better-sqlite3.
 * - Stores the database file at `data/pulse.db`.
 * - Enforces SQLite foreign keys (`PRAGMA foreign_keys = ON`).
 * - Executes `schema.sql` on startup to ensure all tables, constraints,
 *   and indexes exist before handling any requests.
 * - Exposes the singleton `db` instance for use across the application.
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// Define path to the persistent database file
const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "pulse.db");
const SCHEMA_FILE = path.join(__dirname, "schema.sql");

// Ensure the data/ directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Open the SQLite database connection
// better-sqlite3 opens synchronously and provides robust native performance
const db = new Database(DB_FILE, {
  // verbose: console.log // Uncomment for SQL statement debugging if needed
});

// CRITICAL: SQLite disables foreign key enforcement by default for backwards compatibility.
// Must be explicitly enabled on every connection to maintain referential integrity.
db.pragma("foreign_keys = ON");

// Optimize write performance and concurrency with Write-Ahead Logging (WAL)
db.pragma("journal_mode = WAL");

/**
 * Initializes database tables and indexes from schema.sql.
 * Safe to execute repeatedly on startup thanks to CREATE TABLE IF NOT EXISTS.
 */
function initSchema() {
  const schemaSql = fs.readFileSync(SCHEMA_FILE, "utf-8");
  db.exec(schemaSql);
}

// Automatically create tables on startup
initSchema();

module.exports = db;
