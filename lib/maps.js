// lib/maps.js — fonte única dos mapas: como se chamam e quais entram no veto.

// Nome de exibição. Vai além do pool de propósito: o placar ao vivo mostra o
// mapa que o servidor do CS2 está rodando, que pode estar fora do Active Duty.
const NOMES = {
  de_ancient: 'Ancient',
  de_anubis: 'Anubis',
  de_dust2: 'Dust II',
  de_inferno: 'Inferno',
  de_mirage: 'Mirage',
  de_nuke: 'Nuke',
  de_train: 'Train',
  de_overpass: 'Overpass',
  de_vertigo: 'Vertigo',
  de_cache: 'Cache',
  de_office: 'Office',
  de_italy: 'Italy',
};

// ====== POOL DO VETO (edite aqui se a Valve mudar o Active Duty) ======
const POOL = [
  'de_ancient',
  'de_anubis',
  'de_dust2',
  'de_inferno',
  'de_mirage',
  'de_nuke',
  'de_train',
];
// ======================================================================

export const MAPS = POOL.map((id) => ({ id, nome: NOMES[id] ?? id }));

/** Nome de exibição; mapa desconhecido cai no próprio id (melhor que vazio). */
export const nomeDoMapa = (id) => NOMES[id] ?? id;
