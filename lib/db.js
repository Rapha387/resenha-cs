// lib/db.js — SQLite local (arquivo resenha.db criado automaticamente)
import Database from 'better-sqlite3';
import path from 'path';

// singleton: evita abrir várias conexões no hot-reload do Next
const globalForDb = globalThis;

function createDb() {
  const dbPath = process.env.SQLITE_PATH || (process.env.VERCEL ? path.join('/tmp', 'resenha.db') : path.join(process.cwd(), 'resenha.db'));
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    steamid TEXT PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    premier INTEGER,
    leetify_rating REAL,
    aim REAL,
    utility REAL,
    hs_pct REAL,
    winrate REAL,
    stats_json TEXT,
    stats_updated INTEGER,
    elo INTEGER DEFAULT 1000,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created INTEGER
  );
  CREATE TABLE IF NOT EXISTS lobbies (
    code TEXT PRIMARY KEY,
    owner TEXT,
    status TEXT DEFAULT 'aguardando',
    mode TEXT,
    cap_a TEXT,
    cap_b TEXT,
    turn TEXT,
    decider_map TEXT,
    created INTEGER
  );
  CREATE TABLE IF NOT EXISTS lobby_players (
    code TEXT,
    steamid TEXT,
    team TEXT,
    joined INTEGER,
    PRIMARY KEY (code, steamid)
  );
  CREATE TABLE IF NOT EXISTS vetoes (
    code TEXT,
    map TEXT,
    banned_by TEXT,
    ord INTEGER,
    PRIMARY KEY (code, map)
  );
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    map TEXT,
    score_a INTEGER,
    score_b INTEGER,
    winner TEXT,
    teams_json TEXT,
    played_at INTEGER
  );`);
  return db;
}

export const db = globalForDb.__resenhaDb ?? (globalForDb.__resenhaDb = createDb());
