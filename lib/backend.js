// lib/backend.js — avisa o backend dedicado (Resenha Client) sobre o ciclo
// da partida. Totalmente opcional: sem BACKEND_URL configurada o site
// funciona exatamente como antes (só sem coleta automática de stats do CS2).
export async function notifyBackend(path, body) {
  const base = process.env.BACKEND_URL;
  const key = process.env.BACKEND_INTERNAL_KEY;
  if (!base || !key) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.error(`backend respondeu ${res.status} em ${path}`);
      return null;
    }
    return await res.json().catch(() => null);
  } catch (e) {
    // Backend fora do ar não pode travar o site — a resenha continua.
    console.error(`backend indisponível (${path}):`, e.message);
    return null;
  }
}
