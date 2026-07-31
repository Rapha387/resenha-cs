// lib/codigos.js — geração dos códigos que a galera digita: o do lobby (que
// vai no grupo) e o de pareamento do Resenha Client.
import crypto from 'crypto';

// Sem 0/O/1/I: são os pares que mais geram erro de digitação. Como os dois
// códigos são lidos em voz alta ou copiados na correria, vale a restrição.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Código aleatório de `tamanho` caracteres, com entropia criptográfica. */
export function gerarCodigo(tamanho) {
  return Array.from(
    { length: tamanho },
    () => ALFABETO[crypto.randomInt(ALFABETO.length)]
  ).join('');
}

export const TAMANHO_CODIGO_LOBBY = 5;
export const TAMANHO_CODIGO_PAREAMENTO = 6;
