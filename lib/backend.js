// lib/backend.js — conversa com o backend dedicado (o que fala com o Resenha.
// Client). Totalmente opcional: sem BACKEND_URL configurada o site funciona
// exatamente como antes, só sem a coleta automática de stats do CS2.
export const backendConfigurado = () =>
  Boolean(process.env.BACKEND_URL && process.env.BACKEND_INTERNAL_KEY);

async function callBackend(path, { method = 'GET', body, timeout = 4000 } = {}) {
  if (!backendConfigurado()) return null;
  const base = process.env.BACKEND_URL.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.BACKEND_INTERNAL_KEY },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
      cache: 'no-store',
    });
    // 404 é esperado quando ainda não há partida ativa pro lobby.
    if (!res.ok) {
      if (res.status !== 404) console.error(`backend respondeu ${res.status} em ${path}`);
      return null;
    }
    return await res.json().catch(() => null);
  } catch (e) {
    // Backend fora do ar não pode travar o site — a resenha continua.
    console.error(`backend indisponível (${path}):`, e.message);
    return null;
  }
}

// START_MATCH / END_MATCH. O backend hiberna no plano gratuito e o cold start
// passa dos 4s do GET, mas essa chamada trava a resposta do veto — por isso
// 12s e nada de retry aqui. Se mesmo assim se perder, o polling do placar
// (liveState → startMatch idempotente) recupera sozinho.
export const notifyBackend = (path, body) =>
  callBackend(path, { method: 'POST', body, timeout: 12000 });

/** Placar/stats ao vivo de um lobby (null se não houver backend ou partida). */
export const liveState = (code) => callBackend(`/internal/lobby/${code}/state`);
