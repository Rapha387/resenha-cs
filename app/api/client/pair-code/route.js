// Gera o código de conexão do Resenha Client (app desktop).
// O usuário loga aqui com a Steam, gera o código e digita no app — o backend
// dedicado troca o código pelos tokens em POST /api/client/auth/pair,
// validando nesta mesma tabela (banco compartilhado).
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
export const dynamic = 'force-dynamic';

// Sem 0/O/1/I pra ninguém digitar errado (mesmo alfabeto do código de lobby)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TTL_MS = 5 * 60 * 1000; // expira em 5 minutos
const CODE_LEN = 6;

function genPairCode() {
  let code = '';
  for (let i = 0; i < CODE_LEN; i++) code += CHARS[crypto.randomInt(CHARS.length)];
  return code;
}

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });

  const now = Date.now();

  // Limpeza: códigos expirados/usados de qualquer usuário, e códigos ainda
  // válidos deste usuário (só o mais novo vale — evita acumular código vivo).
  await db.batch([
    { sql: 'DELETE FROM client_pair_codes WHERE expires < ? OR used = 1', args: [now] },
    { sql: 'DELETE FROM client_pair_codes WHERE steamid = ?', args: [user.steamid] },
  ]);

  // PRIMARY KEY garante unicidade; colisão em 32^6 é raríssima, mas se rolar
  // tentamos outro código.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const code = genPairCode();
    try {
      await db.prepare(
        'INSERT INTO client_pair_codes (code, steamid, expires, used, created) VALUES (?, ?, ?, 0, ?)'
      ).run(code, user.steamid, now + TTL_MS, now);
      return NextResponse.json({ code, expires: now + TTL_MS });
    } catch (e) {
      if (tentativa === 4) throw e;
    }
  }
}
