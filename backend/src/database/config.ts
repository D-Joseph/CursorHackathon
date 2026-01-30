import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path - use the workspace root
const DB_PATH = path.resolve(process.cwd(), 'data/orbit.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export default db;

export { DB_PATH };
