'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Mensagem de erro que se apaga sozinha. Ao contrário da versão antiga,
// cancela o timer anterior e limpa no unmount (nada de setState em componente morto).
export function useFlashError(duracao = 5000) {
  const [erro, setErro] = useState('');
  const timer = useRef(null);

  const mostraErro = useCallback((msg) => {
    setErro(String(msg || 'Deu ruim aqui. Tenta de novo.'));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setErro(''), duracao);
  }, [duracao]);

  const limpaErro = useCallback(() => {
    clearTimeout(timer.current);
    setErro('');
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { erro, mostraErro, limpaErro };
}
