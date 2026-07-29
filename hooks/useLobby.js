'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useFlashError } from './useFlashError';

const INTERVALO = 2000;

// Cuida de todo o ciclo de vida do lobby: identifica quem sou, entra na sala,
// consulta o estado em loop e expõe as ações (start/pick/ban/result).
export function useLobby(code) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [state, setState] = useState(null);
  const [naoExiste, setNaoExiste] = useState(false);
  const { erro, mostraErro } = useFlashError();

  const meRef = useRef(null);
  const buscando = useRef(false);
  const refazer = useRef(false);
  // 'finalizado' é estado terminal: nada mais muda no lobby, então o polling
  // de 2s vira só custo (relevante com o site na Vercel e o banco no Turso).
  const terminou = useRef(false);

  const atualizar = useCallback(async function busca() {
    // consulta em voo: marca pra refazer no fim em vez de disparar em paralelo
    // (respostas fora de ordem faziam a tela voltar no tempo)
    if (buscando.current) { refazer.current = true; return; }
    buscando.current = true;
    try {
      if (!meRef.current) {
        const { user } = await api('/api/me');
        if (!user) { router.push('/'); return; }
        meRef.current = user;
        setMe(user);
        await api(`/api/lobby/${code}/join`, { method: 'POST' }).catch(() => {});
      }
      const dados = await api(`/api/lobby/${code}`);
      terminou.current = dados?.lobby?.status === 'finalizado';
      setState(dados);
      setNaoExiste(false);
    } catch (e) {
      // erro de rede no polling é silencioso; só lobby inexistente muda a tela
      if (String(e.message).includes('não encontrado')) setNaoExiste(true);
    } finally {
      buscando.current = false;
      if (refazer.current) { refazer.current = false; busca(); }
    }
  }, [code, router]);

  useEffect(() => {
    atualizar();
    const id = setInterval(() => { if (!document.hidden && !terminou.current) atualizar(); }, INTERVALO);
    const aoVoltar = () => { if (!document.hidden && !terminou.current) atualizar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [atualizar]);

  const acao = useCallback(async (rota, body) => {
    try {
      await api(`/api/lobby/${code}/${rota}`, { method: 'POST', body });
      await atualizar();
    } catch (e) {
      mostraErro(e.message);
    }
  }, [code, atualizar, mostraErro]);

  const derivado = useMemo(() => {
    if (!state || !me) return null;
    const { lobby, players } = state;
    const nomeDe = (steamid) =>
      players.find(p => p.steamid === steamid)?.name || '???';
    return {
      souDono: lobby.owner === me.steamid,
      minhaVez: lobby.turn === me.steamid,
      vezDoA: lobby.turn === lobby.cap_a,
      nomeDe,
      jogadorDaVez: players.find(p => p.steamid === lobby.turn) || null,
      mapaDecidido: state.maps.find(m => m.id === lobby.decider_map) || null,
    };
  }, [state, me]);

  return { me, state, derivado, naoExiste, erro, mostraErro, acao, atualizar };
}
