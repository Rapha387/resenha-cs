// lib/times.js — balanceamento automático dos times.
//
// Rating de referência: Premier quando existe (é a régua que a galera
// reconhece), senão o elo interno na mesma escala (×10).
const playerScore = (p) => p.premier || (p.elo || 1000) * 10;

/**
 * Distribui os jogadores em A e B tentando igualar a soma dos ratings,
 * mantendo os times do mesmo tamanho (±1 com número ímpar).
 *
 * Guloso: do mais forte pro mais fraco, cada um cai no time que está mais
 * fraco no momento — simples e suficiente pra uma resenha de 10.
 */
export function montarTimesEquilibrados(jogadores) {
  const ordenados = [...jogadores].sort((a, b) => playerScore(b) - playerScore(a));
  const metade = Math.ceil(ordenados.length / 2);

  let somaA = 0, somaB = 0, qtdA = 0, qtdB = 0;
  return ordenados.map((p) => {
    let team;
    if (qtdA >= metade) team = 'B';
    else if (qtdB >= metade) team = 'A';
    else team = somaA <= somaB ? 'A' : 'B';

    if (team === 'A') { somaA += playerScore(p); qtdA++; }
    else { somaB += playerScore(p); qtdB++; }

    return { steamid: p.steamid, team };
  });
}
