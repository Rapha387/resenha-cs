'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

const INTERVALO = 3000;

// Placar ao vivo do CS2 (vem do backend dedicado via Resenha Client).
// Só consulta enquanto `ativo` — não faz sentido no aguardando/draft/veto.
// Devolve null quando não há backend configurado ou partida em andamento.
export function useLiveMatch(code, ativo) {
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!ativo) { setLive(null); return; }
    let vivo = true;

    async function busca() {
      try {
        const { live: dados } = await api(`/api/lobby/${code}/live`);
        if (vivo) setLive(dados ?? null);
      } catch {
        // erro de rede no polling é silencioso: o placar manual continua lá
      }
    }

    busca();
    const id = setInterval(() => { if (!document.hidden) busca(); }, INTERVALO);
    const aoVoltar = () => { if (!document.hidden) busca(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      vivo = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [code, ativo]);

  return live;
}
