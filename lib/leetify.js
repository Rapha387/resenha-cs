// leetify.js — stats do jogador na API pública da Leetify: busca, normaliza
// e persiste. A API pública pode mudar de formato; o parsing aqui é defensivo:
// procura os campos em vários caminhos possíveis e guarda o JSON bruto também.
import { db } from './db';

// O JSON bruto é guardado pra conseguir extrair campos novos depois sem
// precisar refazer a chamada — mas com teto, pra não inchar a linha.
const MAX_JSON_BRUTO = 200000;

const ENDPOINTS = [
  (id) => `https://api-public.cs-prod.leetify.com/v3/profile?steam64_id=${id}`,
  (id) => `https://api.cs-prod.leetify.com/api/profile/id/${id}`,
  (id) => `https://api.leetify.com/api/profile/${id}`,
];

// pega o primeiro valor numérico encontrado numa lista de caminhos "a.b.c"
function pick(obj, paths) {
  for (const p of paths) {
    let cur = obj;
    let ok = true;
    for (const key of p.split('.')) {
      if (cur && typeof cur === 'object' && key in cur) cur = cur[key];
      else { ok = false; break; }
    }
    if (ok && cur !== null && cur !== undefined && !Number.isNaN(Number(cur))) {
      return Number(cur);
    }
  }
  return null;
}

async function fetchStats(steamid) {
  for (const build of ENDPOINTS) {
    const url = build(steamid);
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'resenha-cs/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data || typeof data !== 'object') continue;

      const stats = {
        premier: pick(data, [
          'ranks.premier', 'rank.premier', 'premier_rank', 'premierRank',
          'ranks.competitive_premier',
        ]),
        leetify_rating: pick(data, [
          'rating.overall', 'rating', 'leetify_rating', 'leetifyRating',
          'recentGameRatings.leetify', 'stats.rating',
        ]),
        aim: pick(data, ['rating.aim', 'aim', 'recentGameRatings.aim', 'stats.aim']),
        utility: pick(data, ['rating.utility', 'utility', 'recentGameRatings.utility', 'stats.utility']),
        hs_pct: pick(data, [
          'stats.accuracy_head', 'hs_percentage', 'headshotPercentage',
          'stats.hs_pct', 'recentGameRatings.hsAccuracy',
        ]),
        winrate: pick(data, ['winrate', 'win_rate', 'stats.winrate', 'winRate']),
        raw: data,
      };

      // Leetify às vezes manda rating em escala -1..1 → normaliza pra exibição
      if (stats.leetify_rating !== null && Math.abs(stats.leetify_rating) <= 1.5) {
        stats.leetify_rating = Math.round(stats.leetify_rating * 100 * 100) / 100;
      }

      return stats;
    } catch (err) {
      // tenta o próximo endpoint
    }
  }
  return null; // sem conta Leetify ou API fora do ar — o site funciona mesmo assim
}

/**
 * Busca as stats e grava no jogador. Nunca estoura: sem conta na Leetify ou
 * com a API fora do ar o site segue funcionando com o elo interno.
 * Retorna true se algo foi atualizado.
 */
export async function refreshStats(steamid) {
  try {
    const s = await fetchStats(steamid);
    if (!s) return false;
    await db.prepare(`
      UPDATE players SET premier = ?, leetify_rating = ?, aim = ?, utility = ?,
        hs_pct = ?, winrate = ?, stats_json = ?, stats_updated = ? WHERE steamid = ?`
    ).run(s.premier, s.leetify_rating, s.aim, s.utility, s.hs_pct, s.winrate,
      JSON.stringify(s.raw).slice(0, MAX_JSON_BRUTO), Date.now(), steamid);
    return true;
  } catch (err) {
    console.error('Leetify falhou para', steamid, err.message);
    return false;
  }
}

