/**
 * Database Reset Script (db/reset.js)
 * DecodeLabs Full Stack Training - Project 3: Database Integration
 *
 * Role in System:
 * - Invoked via `npm run reset-db`.
 * - Safely deletes the database file and re-applies schema.sql + seed.js.
 * - Guarantees a fresh, clean development database state.
 */

const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "..", "data");
const dbFiles = [
  path.join(DATA_DIR, "pulse.db"),
  path.join(DATA_DIR, "pulse.db-wal"),
  path.join(DATA_DIR, "pulse.db-shm"),
  path.join(DATA_DIR, "pulse.db-journal")
];

console.log("[DB Reset] Resetting Pulse API SQLite database...");

// 1. Delete existing database and journal/WAL files
for (const file of dbFiles) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`[DB Reset] Deleted: ${path.basename(file)}`);
    } catch (err) {
      console.warn(`[DB Reset] Warning: could not delete ${path.basename(file)}:`, err.message);
    }
  }
}

// 2. Re-import database.js (recreates tables from schema.sql) and seed.js
const { seedDatabase } = require("./seed");

// 3. Re-seed with default starter records
seedDatabase(true);

console.log("[DB Reset] Database successfully reset, schema initialized, and seeded!");
