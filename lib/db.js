// lib/db.js — Turso (libSQL) via HTTP. Sem binário nativo e sem arquivo local,
// então funciona no ambiente serverless da Vercel (o filesystem lá é read-only
// e o /tmp não é compartilhado entre invocações).
import { createClient } from '@libsql/client/web';

const globalForDb = globalThis;

function createLibsqlClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL não configurada. Crie um banco em https://turso.tech e ' +
      'defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis de ambiente.'
    );
  }
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}

function client() {
  return globalForDb.__resenhaClient ?? (globalForDb.__resenhaClient = createLibsqlClient());
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS players (
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
  )`,
  `CREATE TABLE IF NOT EXISTS lobbies (
    code TEXT PRIMARY KEY,
    owner TEXT,
    status TEXT DEFAULT 'aguardando',
    mode TEXT,
    cap_a TEXT,
    cap_b TEXT,
    turn TEXT,
    decider_map TEXT,
    created INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS lobby_players (
    code TEXT,
    steamid TEXT,
    team TEXT,
    joined INTEGER,
    PRIMARY KEY (code, steamid)
  )`,
  `CREATE TABLE IF NOT EXISTS vetoes (
    code TEXT,
    map TEXT,
    banned_by TEXT,
    ord INTEGER,
    PRIMARY KEY (code, map)
  )`,
  `CREATE TABLE IF NOT EXISTS client_pair_codes (
    code TEXT PRIMARY KEY,
    steamid TEXT NOT NULL,
    expires INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    created INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    map TEXT,
    score_a INTEGER,
    score_b INTEGER,
    winner TEXT,
    teams_json TEXT,
    played_at INTEGER
  )`,
  // Abertura do cálculo do RRS por jogador — quem escreve é o backend, no
  // registro automático do placar. DDL idêntica em src/db.js do backend.
  // pis/q/metricas ficam NULL quando o jogador não teve dados suficientes.
  `CREATE TABLE IF NOT EXISTS match_player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    steamid TEXT NOT NULL,
    rounds INTEGER,
    kills INTEGER, assists INTEGER, deaths INTEGER,
    kast_rounds INTEGER, ek INTEGER, ed INTEGER, tk INTEGER,
    clutch_pts REAL, mvps INTEGER, plants INTEGER, defuses INTEGER,
    pis REAL, q REAL, delta_elo INTEGER,
    metricas TEXT,
    created INTEGER
  )`,

  // ---- Índices (as PKs cobrem o resto das consultas) ----
  // lobbyState busca o resultado por code (matches cresce a cada partida).
  `CREATE INDEX IF NOT EXISTS idx_matches_code ON matches (code)`,
  // A PK (code, steamid) não serve consulta só por steamid — o backend
  // dedicado usa isso no resync pra achar a partida ativa do jogador.
  `CREATE INDEX IF NOT EXISTS idx_lobby_players_steamid ON lobby_players (steamid)`,
  // /api/ranking: ORDER BY elo DESC, wins DESC LIMIT 50 — com o índice o
  // SQLite percorre já em ordem e para nos 50 primeiros que passam no WHERE.
  `CREATE INDEX IF NOT EXISTS idx_players_ranking ON players (elo DESC, wins DESC)`,
  // Mesmos índices declarados no backend (a tabela é compartilhada).
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mps_unico ON match_player_stats (match_id, steamid)`,
  `CREATE INDEX IF NOT EXISTS idx_mps_steamid_created ON match_player_stats (steamid, created)`,
];

function ensureSchema() {
  globalForDb.__resenhaSchema ??= client().batch(SCHEMA, 'write');
  return globalForDb.__resenhaSchema;
}

function toObject(row, columns) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

// undefined não é um valor válido de bind no libSQL; a Leetify pode devolver
// campos ausentes, que no SQLite precisam virar NULL.
const bind = (args) => args.map((a) => (a === undefined ? null : a));

async function execute(sql, args) {
  await ensureSchema();
  return client().execute({ sql, args: bind(args) });
}

// Espelha a superfície do better-sqlite3 (prepare().get/.all/.run), mas assíncrona.
export const db = {
  prepare(sql) {
    return {
      async get(...args) {
        const rs = await execute(sql, args);
        return rs.rows[0] ? toObject(rs.rows[0], rs.columns) : undefined;
      },
      async all(...args) {
        const rs = await execute(sql, args);
        return rs.rows.map((r) => toObject(r, rs.columns));
      },
      async run(...args) {
        return execute(sql, args);
      },
    };
  },
  // statements: [{ sql, args }] — roda tudo numa transação só
  async batch(statements) {
    await ensureSchema();
    return client().batch(
      statements.map((s) => ({ sql: s.sql, args: bind(s.args ?? []) })),
      'write'
    );
  },
};
