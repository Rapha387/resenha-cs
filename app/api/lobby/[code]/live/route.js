// Placar ao vivo: proxy pro backend dedicado (que recebe os eventos do CS2
// via Resenha Client). A chave interna fica só no servidor, nunca no browser.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { liveState, notifyBackend, backendConfigurado } from '@/lib/backend';
export const dynamic = 'force-dynamic';

// Última tentativa de recuperação por lobby (ver abaixo). Os 10 jogadores
// consultam ao mesmo tempo — sem esse freio, um backend fora do ar viraria
// dezenas de POST por minuto.
const ultimaTentativa = new Map();
const INTERVALO_RETRY_MS = 15_000;

export async function GET(request, { params }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ erro: 'Faça login com a Steam primeiro' }, { status: 401 });
  if (!backendConfigurado()) return NextResponse.json({ live: null });

  const code = params.code.toUpperCase();
  // Só quem está no lobby vê as stats ao vivo da galera.
  const [dentro, lobby] = await Promise.all([
    db.prepare('SELECT 1 FROM lobby_players WHERE code = ? AND steamid = ?').get(code, user.steamid),
    db.prepare('SELECT status FROM lobbies WHERE code = ?').get(code),
  ]);
  if (!dentro) return NextResponse.json({ erro: 'Você não está nesse lobby.' }, { status: 403 });

  let live = await liveState(code);

  // Autocorreção: o veto acabou mas o backend não tem partida — o
  // /internal/match/start do fim do veto se perdeu (backend hibernando,
  // deploy no meio, rede). Como startMatch é idempotente, reavisar aqui é
  // seguro e devolve a coleta sem ninguém precisar refazer o lobby.
  const perdido = !live && lobby?.status === 'pronto';
  const agora = Date.now();
  if (perdido && agora - (ultimaTentativa.get(code) ?? 0) > INTERVALO_RETRY_MS) {
    ultimaTentativa.set(code, agora);
    if (await notifyBackend('/internal/match/start', { code })) live = await liveState(code);
  }

  return NextResponse.json({ live });
}
