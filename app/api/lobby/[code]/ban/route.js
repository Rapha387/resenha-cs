import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { MAPS } from '@/lib/game';
import { notifyBackend } from '@/lib/backend';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const code = params.code.toUpperCase();
  const { map } = await request.json().catch(() => ({}));

  const lobby = await db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby || lobby.status !== 'veto')
    return NextResponse.json({ erro: 'Não é hora de veto.' }, { status: 400 });
  if (lobby.turn !== user.steamid)
    return NextResponse.json({ erro: 'Não é sua vez de banir.' }, { status: 403 });
  if (!MAPS.find(m => m.id === map))
    return NextResponse.json({ erro: 'Mapa inválido.' }, { status: 400 });

  const banned = (await db.prepare('SELECT map FROM vetoes WHERE code = ?').all(code)).map(v => v.map);
  if (banned.includes(map))
    return NextResponse.json({ erro: 'Esse mapa já foi banido.' }, { status: 400 });

  await db.prepare('INSERT INTO vetoes (code, map, banned_by, ord) VALUES (?, ?, ?, ?)')
    .run(code, map, user.steamid, banned.length + 1);

  const remaining = MAPS.filter(m => !banned.includes(m.id) && m.id !== map);
  if (remaining.length === 1) {
    await db.prepare('UPDATE lobbies SET status = ?, decider_map = ?, turn = NULL WHERE code = ?')
      .run('pronto', remaining[0].id, code);
    // Veto encerrado: o backend dedicado manda START_MATCH pros Resenha Clients
    await notifyBackend('/internal/match/start', { code });
  } else {
    const next = lobby.turn === lobby.cap_a ? lobby.cap_b : lobby.cap_a;
    await db.prepare('UPDATE lobbies SET turn = ? WHERE code = ?').run(next, code);
  }
  return NextResponse.json({ ok: true });
}
