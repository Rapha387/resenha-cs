'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLobby } from '@/hooks/useLobby';
import { useLiveMatch } from '@/hooks/useLiveMatch';

import PageShell from '@/components/layout/PageShell';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import DecidedMapPanel from '@/components/lobby/DecidedMapPanel';
import FinalScorePanel from '@/components/lobby/FinalScorePanel';
import LobbyCodeBadge from '@/components/lobby/LobbyCodeBadge';
import LiveScorePanel from '@/components/lobby/LiveScorePanel';
import LobbyNotFound from '@/components/lobby/LobbyNotFound';
import MapGrid from '@/components/lobby/MapGrid';
import TeamsBoard from '@/components/lobby/TeamsBoard';
import TurnBanner from '@/components/lobby/TurnBanner';
import WaitingRoom from '@/components/lobby/WaitingRoom';

export default function LobbyPage() {
  const { code: rawCode } = useParams();
  const CODE = String(rawCode || '').toUpperCase();

  const { me, state, derivado, naoExiste, erro, mostraErro, acao } = useLobby(CODE);
  const live = useLiveMatch(CODE, state?.lobby?.status === 'pronto');
  const [modo, setModo] = useState('capitaes');
  const [caps, setCaps] = useState({ a: null, b: null });

  // clicar num jogador cicla: capitão A -> capitão B -> desmarca
  function selecionaCapitao(steamid) {
    setCaps(prev => {
      if (prev.a === steamid) return { ...prev, a: null };
      if (prev.b === steamid) return { ...prev, b: null };
      if (!prev.a) return { ...prev, a: steamid };
      if (!prev.b) return { ...prev, b: steamid };
      return { a: steamid, b: null };
    });
  }

  function iniciar() {
    if (modo === 'capitaes') {
      if (!caps.a || !caps.b) {
        mostraErro('Clique em dois jogadores pra definir os capitães primeiro.');
        return;
      }
      acao('start', { mode: 'capitaes', capA: caps.a, capB: caps.b });
      return;
    }
    acao('start', { mode: 'auto' });
  }

  function trocaModo(novo) {
    setModo(novo);
    if (novo === 'auto') setCaps({ a: null, b: null });
  }

  const shellProps = {
    direita: <LobbyCodeBadge code={CODE} />,
    rodape: 'compartilhe o código com a galera pra entrarem',
  };

  if (naoExiste) {
    return <PageShell {...shellProps}><LobbyNotFound code={CODE} /></PageShell>;
  }

  if (!state || !me || !derivado) {
    return <PageShell {...shellProps}><Loading className="mt">Carregando lobby</Loading></PageShell>;
  }

  const { lobby, players, vetoes, maps, match } = state;
  const { souDono, minhaVez, vezDoA, nomeDe, jogadorDaVez, mapaDecidido } = derivado;
  const nomeA = nomeDe(lobby.cap_a);
  const nomeB = nomeDe(lobby.cap_b);
  const nomeMapa = mapaDecidido?.nome || lobby.decider_map;

  const times = (bancoClicavel) => (
    <TeamsBoard
      lobby={lobby}
      players={players}
      nomeDe={nomeDe}
      onPick={bancoClicavel ? (steamid => acao('pick', { steamid })) : null}
    />
  );

  const mapas = (
    <MapGrid
      maps={maps}
      vetoes={vetoes}
      deciderMap={lobby.decider_map}
      podeBanir={lobby.status === 'veto' && minhaVez}
      onBan={map => acao('ban', { map })}
      nomeDe={nomeDe}
    />
  );

  return (
    <PageShell {...shellProps}>
      <Alert className="mt-sm">{erro}</Alert>

      {lobby.status === 'aguardando' && (
        <WaitingRoom
          lobby={lobby}
          players={players}
          souDono={souDono}
          caps={caps}
          modo={modo}
          onModo={trocaModo}
          onCapitao={selecionaCapitao}
          onIniciar={iniciar}
          nomeDe={nomeDe}
        />
      )}

      {lobby.status === 'draft' && (
        <>
          <TurnBanner jogador={jogadorDaVez} vezDoA={vezDoA} minhaVez={minhaVez}>
            {minhaVez ? '👉 Sua vez! Escolha um jogador' : `Vez de ${nomeDe(lobby.turn)} escolher`}
          </TurnBanner>
          {times(minhaVez)}
        </>
      )}

      {lobby.status === 'veto' && (
        <>
          <TurnBanner jogador={jogadorDaVez} vezDoA={vezDoA} minhaVez={minhaVez}>
            {minhaVez ? '🔨 Sua vez! Bana um mapa' : `Vez de ${nomeDe(lobby.turn)} banir`}
          </TurnBanner>
          {mapas}
          <div className="mt">{times(false)}</div>
        </>
      )}

      {lobby.status === 'pronto' && (
        <>
          <LiveScorePanel live={live} nomeA={nomeA} nomeB={nomeB} />
          <DecidedMapPanel mapaNome={nomeMapa}>
            <p className="fraco mt">
              {live?.finished
                ? '🏁 Partida encerrada — registrando o placar automaticamente…'
                : 'O placar é registrado sozinho quando a partida termina no CS2 (precisa de pelo menos um jogador com o Resenha Client aberto).'}
            </p>
          </DecidedMapPanel>
          <div className="mt">{times(false)}</div>
          <div className="mt">{mapas}</div>
        </>
      )}

      {lobby.status === 'finalizado' && match && (
        <>
          <FinalScorePanel
            mapaNome={maps.find(m => m.id === match.map)?.nome || match.map}
            match={match}
            nomeA={nomeA}
            nomeB={nomeB}
          />
          <div className="mt">{times(false)}</div>
        </>
      )}

      {lobby.status === 'abandonado' && (
        <>
          <EmptyState
            className="mt"
            icone="⏳"
            titulo="Partida encerrada sem registro"
          >
            O fim do jogo não foi detectado — ninguém estava com o Resenha Client
            aberto, ou a partida terminou empatada. Nenhum elo mudou; é só criar
            outro lobby pra próxima.
          </EmptyState>
          <div className="mt">{times(false)}</div>
        </>
      )}
    </PageShell>
  );
}
