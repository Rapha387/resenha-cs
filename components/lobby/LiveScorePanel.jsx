'use client';
import Panel from '@/components/ui/Panel';
import Avatar from '@/components/ui/Avatar';
import { nomeDoMapa } from '@/lib/maps';

function Linha({ p }) {
  const classe = [
    'live-jogador',
    p.no_jogo ? '' : 'aguardando',
    p.health === 0 ? 'morto' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classe}>
      <Avatar src={p.avatar} nome={p.name} tamanho="sm" />
      <span className="nome">{p.name || p.steamid}</span>
      {p.side ? <span className={`lado lado-${p.side.toLowerCase()}`}>{p.side}</span> : null}
      {p.no_jogo ? (
        <span className="kda">{p.kills}/{p.deaths}/{p.assists}</span>
      ) : (
        <span className="kda aviso" title={p.client_online
          ? 'Resenha Client conectado, esperando a pessoa entrar na partida'
          : 'Resenha Client fechado — as stats dessa pessoa não vão ser registradas'}>
          {p.client_online ? 'fora do jogo' : '⚠ client off'}
        </span>
      )}
    </div>
  );
}

export default function LiveScorePanel({ live, nomeA, nomeB }) {
  if (!live) return null;

  const { score_a, score_b, map, round, round_phase, finished, players } = live;
  const temPlacar = score_a !== null && score_b !== null;
  const timeA = players.filter(p => p.team === 'A');
  const timeB = players.filter(p => p.team === 'B');
  const semClient = players.filter(p => !p.client_online);

  const situacao = finished
    ? 'Partida encerrada'
    : round
      ? `Round ${round + 1}${round_phase === 'freezetime' ? ' — freezetime' : ''}`
      : 'Aguardando o jogo começar';

  return (
    <Panel className="live-painel mt">
      <div className="live-topo">
        <span className={`live-tag${finished ? ' fim' : ''}`}>
          {finished ? '● ENCERRADA' : '● AO VIVO'}
        </span>
        <span className="fraco">
          {map ? nomeDoMapa(map) : '—'} · {situacao}
        </span>
      </div>

      {semClient.length > 0 && !finished ? (
        <p className="live-alerta">
          ⚠ {semClient.length === 1
            ? <><b>{semClient[0].name || semClient[0].steamid}</b> está com o Resenha Client fechado</>
            : <><b>{semClient.length} jogadores</b> estão com o Resenha Client fechado</>
          } — as stats de quem estiver sem o app não entram no placar.
        </p>
      ) : null}

      {temPlacar ? (
        <div className="live-placar">
          <div className="lado">
            <span className="time">{nomeA}</span>
            <b>{score_a}</b>
          </div>
          <span className="x">×</span>
          <div className="lado">
            <b>{score_b}</b>
            <span className="time">{nomeB}</span>
          </div>
        </div>
      ) : (
        <p className="fraco">
          Esperando os dados do CS2. Abra o jogo com o Resenha Client ligado —
          o placar aparece sozinho.
        </p>
      )}

      <div className="live-times">
        <div>
          <div className="rotulo">Time {nomeA}</div>
          {timeA.map(p => <Linha key={p.steamid} p={p} />)}
        </div>
        <div>
          <div className="rotulo">Time {nomeB}</div>
          {timeB.map(p => <Linha key={p.steamid} p={p} />)}
        </div>
      </div>
      <p className="fraco live-legenda">K/D/A de cada jogador, direto do CS2.</p>
    </Panel>
  );
}
