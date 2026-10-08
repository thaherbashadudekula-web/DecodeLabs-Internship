/**
 * Database Schema Definition (db/schema.sql)
 * DecodeLabs Full Stack Training - Project 3: Database Integration
 *
 * This file defines the relational data schema for the Pulse API using SQLite.
 *
 * Key Concepts Demonstrated:
 * 1. Primary Keys & Auto-incrementation (INTEGER PRIMARY KEY AUTOINCREMENT)
 * 2. Uniqueness Constraints (UNIQUE on project names to prevent duplicates)
 * 3. Range & Value Constraints (CHECK constraints on progress, title, status, priority)
 * 4. Referential Integrity (FOREIGN KEY with ON DELETE CASCADE)
 * 5. Indexing for Query Optimization (INDEX on foreign key column tasks.project_id)
 * 6. Audit Timestamps (created_at with SQLite's datetime('now') default)
 */

-- Enable foreign key constraint checks in SQLite
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. PROJECTS TABLE
-- Represents overarching initiatives / workspaces.
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 2. TASKS TABLE
-- Represents individual work items associated with a project.
-- 1:Many Relationship: Each task belongs to one project.
-- ON DELETE CASCADE ensures tasks are cleaned up when the project is removed.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  project_id INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. INDEXES
-- Indexing the foreign key project_id accelerates JOINs, subqueries,
-- and lookups such as GET /api/projects/:id/tasks and CASCADE deletions.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
