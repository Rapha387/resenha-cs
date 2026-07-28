import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { playerScore } from '@/lib/game';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  const code = params.code.toUpperCase();
  const { mode, capA, capB } = await request.json().catch(() => ({}));

  const lobby = await db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code);
  if (!lobby) return NextResponse.json({ erro: 'Lobby não encontrado.' }, { status: 404 });
  if (lobby.owner !== user.steamid)
    return NextResponse.json({ erro: 'Só quem criou o lobby pode iniciar.' }, { status: 403 });
  if (lobby.status !== 'aguardando')
    return NextResponse.json({ erro: 'Lobby já iniciado.' }, { status: 400 });

  const players = await db.prepare('SELECT steamid FROM lobby_players WHERE code = ?').all(code);
  if (players.length < 2)
    return NextResponse.json({ erro: 'Precisa de pelo menos 2 jogadores.' }, { status: 400 });

  if (mode === 'auto') {
    const full = await Promise.all(
      players.map(p => db.prepare('SELECT * FROM players WHERE steamid = ?').get(p.steamid))
    );
    full.sort((a, b) => playerScore(b) - playerScore(a));
    let sumA = 0, sumB = 0, countA = 0, countB = 0;
    const half = Math.ceil(full.length / 2);
    const times = [];
    for (const p of full) {
      let team;
      if (countA >= half) team = 'B';
      else if (countB >= half) team = 'A';
      else team = sumA <= sumB ? 'A' : 'B';
      if (team === 'A') { sumA += playerScore(p); countA++; } else { sumB += playerScore(p); countB++; }
      times.push({
        sql: 'UPDATE lobby_players SET team = ? WHERE code = ? AND steamid = ?',
        args: [team, code, p.steamid],
      });
    }
    await db.batch(times);

    const best = (t) => db.prepare(`SELECT lp.steamid FROM lobby_players lp JOIN players p ON p.steamid = lp.steamid
      WHERE lp.code = ? AND lp.team = ? ORDER BY COALESCE(p.premier, p.elo * 10) DESC LIMIT 1`).get(code, t);
    const [bestA, bestB] = await Promise.all([best('A'), best('B')]);
    await db.prepare('UPDATE lobbies SET status = ?, mode = ?, cap_a = ?, cap_b = ?, turn = ? WHERE code = ?')
      .run('veto', 'auto', bestA.steamid, bestB.steamid, bestA.steamid, code);
    return NextResponse.json({ ok: true, proximo: 'veto' });
  }

  if (!capA || !capB || capA === capB)
    return NextResponse.json({ erro: 'Escolha dois capitães diferentes.' }, { status: 400 });
  const inLobby = (id) => db.prepare('SELECT 1 FROM lobby_players WHERE code = ? AND steamid = ?').get(code, id);
  const [temA, temB] = await Promise.all([inLobby(capA), inLobby(capB)]);
  if (!temA || !temB)
    return NextResponse.json({ erro: 'Os capitães precisam estar no lobby.' }, { status: 400 });

  const upd = 'UPDATE lobby_players SET team = ? WHERE code = ? AND steamid = ?';
  await db.batch([
    { sql: upd, args: ['A', code, capA] },
    { sql: upd, args: ['B', code, capB] },
  ]);

  // BUG CORRIGIDO da v1: com exatamente 2 jogadores (só os capitães),
  // o draft não tem ninguém pra escolher — pula direto pro veto.
  const restam = (await db.prepare('SELECT COUNT(*) c FROM lobby_players WHERE code = ? AND team IS NULL').get(code)).c;
  const statusInicial = restam === 0 ? 'veto' : 'draft';

  await db.prepare('UPDATE lobbies SET status = ?, mode = ?, cap_a = ?, cap_b = ?, turn = ? WHERE code = ?')
    .run(statusInicial, 'capitaes', capA, capB, capA, code);
  return NextResponse.json({ ok: true, proximo: statusInicial });
}
