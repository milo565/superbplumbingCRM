import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Persist the SQLite file next to the server package so it survives restarts.
const DB_PATH = process.env.CRM_DB_PATH
  ? resolve(process.env.CRM_DB_PATH)
  : resolve(__dirname, "..", "data", "crm.sqlite");

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      priority TEXT NOT NULL DEFAULT 'normal',
      scheduled_for TEXT,
      price_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export const JOB_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const JOB_PRIORITIES = ["low", "normal", "high", "emergency"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobPriority = (typeof JOB_PRIORITIES)[number];
