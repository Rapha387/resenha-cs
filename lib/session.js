// lib/session.js — sessão via cookie assinado (HMAC)
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { db } from './db';

let cachedSecret = null;

// Em produção o segredo PRECISA vir do ambiente: cada instância serverless tem
// seu próprio /tmp, então um segredo gerado em disco derrubaria a sessão dos
// jogadores sempre que a requisição caísse noutra instância.
function getSecret() {
  if (cachedSecret) return cachedSecret;
  if (process.env.SESSION_SECRET) {
    cachedSecret = process.env.SESSION_SECRET;
    return cachedSecret;
  }
  if (process.env.VERCEL) {
    throw new Error(
      'SESSION_SECRET não configurada. Defina essa variável de ambiente na Vercel ' +
      '(gere com: openssl rand -hex 32).'
    );
  }
  const SECRET_FILE = path.join(process.cwd(), '.session-secret');
  if (!fs.existsSync(SECRET_FILE)) {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'));
  }
  cachedSecret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  return cachedSecret;
}

export function sign(value) {
  const mac = crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
  return `${value}.${mac}`;
}

export function unsign(signed) {
  if (!signed) return null;
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
  try {
    if (crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return value;
  } catch (_) {}
  return null;
}

export async function currentUser() {
  const raw = cookies().get('resenha_sid')?.value;
  const steamid = unsign(raw);
  if (!steamid) return null;
  return (await db.prepare('SELECT * FROM players WHERE steamid = ?').get(steamid)) || null;
}

export const COOKIE_NAME = 'resenha_sid';
// `secure` NÃO fica fixo aqui de propósito: o site pode rodar atrás de túnel
// ou IP de VPN em http (ver lib/baseUrl.js), onde a flag faria o navegador
// descartar o cookie. Quem grava o cookie decide pela URL real em uso —
// cookieOptionsFor(baseUrl(request)).
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 90,
};

export const cookieOptionsFor = (base) => ({
  ...cookieOptions,
  secure: base.startsWith('https://'),
});
