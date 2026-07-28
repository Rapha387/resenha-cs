// lib/format.js — formatação de números vindos da Leetify (formato instável, tudo defensivo)

export function numero(valor, casas = 1) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(casas);
}

export function inteiro(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Math.round(n).toLocaleString('pt-BR');
}

// a API manda porcentagem às vezes como 0.52, às vezes como 52
export function porcentagem(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return `${(n <= 1 ? n * 100 : n).toFixed(1)}%`;
}

export function dataHora(ms) {
  if (!ms) return null;
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function primeiraLetra(nome) {
  const limpo = String(nome ?? '').trim();
  if (!limpo) return '?';
  return [...limpo][0].toUpperCase();
}
