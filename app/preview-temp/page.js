'use client';
// PÁGINA TEMPORÁRIA DE VERIFICAÇÃO — apagar depois
import PageShell from '@/components/layout/PageShell';
import UserBadge from '@/components/layout/UserBadge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Panel from '@/components/ui/Panel';
import SectionTitle from '@/components/ui/SectionTitle';
import EmptyState from '@/components/ui/EmptyState';
import Hero from '@/components/home/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import JoinLobbyForm from '@/components/home/JoinLobbyForm';
import ProfilePanel from '@/components/home/ProfilePanel';
import RankingTable from '@/components/home/RankingTable';
import LobbyCodeBadge from '@/components/lobby/LobbyCodeBadge';
import LobbyNotFound from '@/components/lobby/LobbyNotFound';
import WaitingRoom from '@/components/lobby/WaitingRoom';
import TurnBanner from '@/components/lobby/TurnBanner';
import TeamsBoard from '@/components/lobby/TeamsBoard';
import MapGrid from '@/components/lobby/MapGrid';
import DecidedMapPanel from '@/components/lobby/DecidedMapPanel';
import ScoreForm from '@/components/lobby/ScoreForm';
import FinalScorePanel from '@/components/lobby/FinalScorePanel';

const P = (n, extra = {}) => ({
  steamid: `7656119800000000${n}`,
  name: `jogador${n}`,
  avatar: null,
  premier: 15000 + n * 700,
  leetify_rating: 1.7 + n / 10,
  aim: 62.4, utility: 48.1, hs_pct: 0.51,
  elo: 1000 + n * 25, wins: n, losses: 1,
  ...extra,
});

const players = [
  P(1, { team: 'A' }), P(2, { team: 'B' }), P(3, { team: 'A' }),
  P(4, { team: null }), P(5, { team: null, premier: null, leetify_rating: null, elo: 1000 }),
];
const lobby = {
  code: 'AB2CD', owner: players[0].steamid, status: 'veto', mode: 'capitaes',
  cap_a: players[0].steamid, cap_b: players[1].steamid,
  turn: players[1].steamid, decider_map: 'de_mirage',
};
const maps = [
  { id: 'de_ancient', nome: 'Ancient' }, { id: 'de_anubis', nome: 'Anubis' },
  { id: 'de_dust2', nome: 'Dust II' }, { id: 'de_inferno', nome: 'Inferno' },
  { id: 'de_mirage', nome: 'Mirage' }, { id: 'de_nuke', nome: 'Nuke' },
  { id: 'de_train', nome: 'Train' },
];
const vetoes = [
  { map: 'de_nuke', banned_by: players[0].steamid, ord: 1 },
  { map: 'de_train', banned_by: players[1].steamid, ord: 2 },
];
const nomeDe = (id) => players.find(p => p.steamid === id)?.name || '???';
const nada = () => {};

export default function Preview() {
  return (
    <PageShell direita={<LobbyCodeBadge code="AB2CD" />} rodape="preview">
      <Hero><JoinLobbyForm onEntrar={nada} /></Hero>
      <Alert>erro de exemplo</Alert>
      <Alert tom="aviso">aviso de exemplo</Alert>
      <Loading>Carregando lobby</Loading>

      <div className="grid-2">
        <div>
          <SectionTitle aside="perfil">Seu perfil</SectionTitle>
          <ProfilePanel user={{ ...P(9), stats_updated: 1700000000000 }} atualizando={false} onAtualizar={nada} />
        </div>
        <div>
          <SectionTitle>Como funciona</SectionTitle>
          <HowItWorks />
        </div>
      </div>

      <SectionTitle aside="top 5">Ranking</SectionTitle>
      <Panel><RankingTable ranking={players} eu={players[2].steamid} /></Panel>

      <UserBadge user={P(1)} onSair={nada} />

      <WaitingRoom
        lobby={{ ...lobby, status: 'aguardando' }} players={players} souDono
        caps={{ a: players[0].steamid, b: players[1].steamid }}
        modo="capitaes" onModo={nada} onCapitao={nada} onIniciar={nada} nomeDe={nomeDe}
      />

      <TurnBanner jogador={players[1]} vezDoA={false} minhaVez>
        🔨 Sua vez! Bana um mapa
      </TurnBanner>
      <TeamsBoard lobby={lobby} players={players} nomeDe={nomeDe} onPick={nada} />
      <MapGrid maps={maps} vetoes={vetoes} deciderMap="de_mirage" podeBanir onBan={nada} nomeDe={nomeDe} />

      <DecidedMapPanel mapaNome="Mirage">
        <ScoreForm nomeA={nomeDe(lobby.cap_a)} nomeB={nomeDe(lobby.cap_b)} onSubmit={nada} />
      </DecidedMapPanel>

      <FinalScorePanel
        mapaNome="Mirage"
        match={{ score_a: 13, score_b: 9, winner: 'A', map: 'de_mirage' }}
        nomeA={nomeDe(lobby.cap_a)} nomeB={nomeDe(lobby.cap_b)}
      />

      <Panel className="mt"><EmptyState icone="🏆" titulo="Vazio">nada aqui</EmptyState></Panel>
      <LobbyNotFound code="ZZZZZ" />
    </PageShell>
  );
}
