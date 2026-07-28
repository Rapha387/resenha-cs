// lib/session.js — sessão via cookie assinado (HMAC)
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { db } from './db';

const SECRET = process.env.SESSION_SECRET || (() => {
  const SECRET_FILE = process.env.VERCEL
    ? path.join('/tmp', '.session-secret')
    : path.join(process.cwd(), '.session-secret');
  try {
    if (!fs.existsSync(SECRET_FILE)) {
      fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'));
    }
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } catch (err) {
    console.error('Não foi possível criar/ler .session-secret:', err);
    return crypto.randomBytes(32).toString('hex');
  }
})();

export function sign(value) {
  const mac = crypto.createHmac('sha256', SECRET).update(value).digest('hex');
  return `${value}.${mac}`;
}

export function unsign(signed) {
  if (!signed) return null;
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(value).digest('hex');
  try {
    if (crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return value;
  } catch (_) {}
  return null;
}

export function currentUser() {
  const raw = cookies().get('resenha_sid')?.value;
  const steamid = unsign(raw);
  if (!steamid) return null;
  return db.prepare('SELECT * FROM players WHERE steamid = ?').get(steamid) || null;
}

export const COOKIE_NAME = 'resenha_sid';
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 90,
};
