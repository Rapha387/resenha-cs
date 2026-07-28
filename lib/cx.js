// junta classes ignorando falsy: cx('btn', ativo && 'ativo') -> "btn ativo"
export function cx(...partes) {
  return partes.filter(Boolean).join(' ');
}
