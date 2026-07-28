// lib/steam.js — busca nome e avatar do jogador na Steam
// BUG CORRIGIDO: na v1, sem STEAM_API_KEY o nome virava "Player 1232".
// Agora, se não houver chave (ou a API falhar), buscamos o perfil PÚBLICO
// da comunidade Steam em XML, que não exige chave nenhuma.

const KEY = process.env.STEAM_API_KEY || '';

function extractCdata(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  if (m) return m[1];
  const plain = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return plain ? plain[1] : null;
}

export async function fetchSteamProfile(steamid) {
  // 1ª opção: Web API oficial (se tiver chave)
  if (KEY) {
    try {
      const r = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${KEY}&steamids=${steamid}`,
        { signal: AbortSignal.timeout(8000), cache: 'no-store' }
      );
      if (r.ok) {
        const j = await r.json();
        const p = j?.response?.players?.[0];
        if (p?.personaname) {
          return { name: p.personaname, avatar: p.avatarfull || '' };
        }
      }
    } catch (_) { /* cai pro fallback */ }
  }

  // 2ª opção: perfil público da comunidade (sem chave)
  try {
    const r = await fetch(`https://steamcommunity.com/profiles/${steamid}?xml=1`, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
      headers: { 'User-Agent': 'resenha-cs/2.0' },
    });
    if (r.ok) {
      const xml = await r.text();
      const name = extractCdata(xml, 'steamID');
      const avatar = extractCdata(xml, 'avatarFull');
      if (name) return { name, avatar: avatar || '' };
    }
  } catch (_) {}

  // último recurso
  return { name: `Player ${steamid.slice(-4)}`, avatar: '' };
}

// Conserta jogadores que ficaram com nome genérico da v1
// (roda em segundo plano, sem travar nada)
export async function fixGenericNames(db) {
  const pendentes = await db
    .prepare(`SELECT steamid FROM players WHERE name IS NULL OR name LIKE 'Player %'`)
    .all();
  for (const { steamid } of pendentes) {
    const perfil = await fetchSteamProfile(steamid);
    if (!perfil.name.startsWith('Player ')) {
      await db.prepare('UPDATE players SET name = ?, avatar = ? WHERE steamid = ?')
        .run(perfil.name, perfil.avatar, steamid);
    }
  }
  return pendentes.length;
}
