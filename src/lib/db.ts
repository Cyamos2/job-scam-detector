// src/lib/db.ts
import * as SQLite from 'expo-sqlite';

// Use the new sync database API (SDK 53+)
const db = SQLite.openDatabaseSync('scamicide.db');

// Create table (no-op if it already exists)
db.execSync(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    risk INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export type JobRow = {
  id: number;
  title: string;
  description: string;
  risk: number;
  created_at: string;
};

export async function initDb(): Promise<void> {
  // kept for compatibility if you call it elsewhere
  return;
}

export async function saveJob(title: string, description: string, risk: number): Promise<void> {
  db.runSync(
    `INSERT INTO jobs (title, description, risk) VALUES (?, ?, ?)`,
    [title, description, risk]
  );
}

export async function getJobs(): Promise<JobRow[]> {
  // `getAllSync` returns an array of objects
  const rows = db.getAllSync(
    `SELECT * FROM jobs ORDER BY datetime(created_at) DESC`
  ) as JobRow[];
  return rows;
}

export async function deleteJob(id: number): Promise<void> {
  db.runSync(`DELETE FROM jobs WHERE id = ?`, [id]);
}

export async function clearJobs(): Promise<void> {
  db.execSync(`DELETE FROM jobs`);
}