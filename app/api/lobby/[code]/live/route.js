// Placar ao vivo: proxy pro backend dedicado (que recebe os eventos do CS2
// via Resenha Client). A chave interna fica só no servidor, nunca no browser.
import { db } from '@/lib/db';
import { liveState, notifyBackend, backendConfigurado } from '@/lib/backend';
import { rotaAutenticada, erro } from '@/lib/rotas';
export const dynamic = 'force-dynamic';

// Última tentativa de recuperação por lobby (ver abaixo). Os 10 jogadores
// consultam ao mesmo tempo — sem esse freio, um backend fora do ar viraria
// dezenas de POST por minuto.
const ultimaTentativa = new Map();
const INTERVALO_RETRY_MS = 15_000;

export const GET = rotaAutenticada(async ({ user, code }) => {
  if (!backendConfigurado()) return { live: null };

  // Só quem está no lobby vê as stats ao vivo da galera.
  const [dentro, lobby] = await Promise.all([
    db.prepare('SELECT 1 FROM lobby_players WHERE code = ? AND steamid = ?').get(code, user.steamid),
    db.prepare('SELECT status FROM lobbies WHERE code = ?').get(code),
  ]);
  if (!dentro) throw erro(403, 'Você não está nesse lobby.');

  const live = await liveState(code);
  return { live: live ?? (await tentarRecuperar(code, lobby)) };
});

/**
 * Autocorreção: o veto acabou mas o backend não tem partida — o
 * /internal/match/start do fim do veto se perdeu (backend hibernando, deploy
 * no meio, rede). Como startMatch é idempotente, reavisar aqui é seguro e
 * devolve a coleta sem ninguém precisar refazer o lobby.
 */
async function tentarRecuperar(code, lobby) {
  if (lobby?.status !== 'pronto') return null;

  const agora = Date.now();
  if (agora - (ultimaTentativa.get(code) ?? 0) <= INTERVALO_RETRY_MS) return null;
  ultimaTentativa.set(code, agora);

  if (!(await notifyBackend('/internal/match/start', { code }))) return null;
  return liveState(code);
}
