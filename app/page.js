'use client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useFlashError } from '@/hooks/useFlashError';
import { useRanking } from '@/hooks/useRanking';
import { useSession } from '@/hooks/useSession';

import PageShell from '@/components/layout/PageShell';
import UserBadge from '@/components/layout/UserBadge';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import Panel from '@/components/ui/Panel';
import SectionTitle from '@/components/ui/SectionTitle';
import Hero from '@/components/home/Hero';
import { CLIENT_INSTALADOR } from '@/components/home/ClientDownload';
import HowItWorks from '@/components/home/HowItWorks';
import JoinLobbyForm from '@/components/home/JoinLobbyForm';
import ProfilePanel from '@/components/home/ProfilePanel';
import RankingTable from '@/components/home/RankingTable';

export default function Home() {
  const router = useRouter();
  const { erro, mostraErro } = useFlashError();
  const { user, carregando, atualizando, atualizarStats, sair } = useSession({ onErro: mostraErro });
  const { ranking } = useRanking();

  async function criarLobby() {
    try {
      const { code } = await api('/api/lobby', { method: 'POST' });
      router.push(`/lobby/${code}`);
    } catch (e) { mostraErro(e.message); }
  }

  async function entrarLobby(code) {
    try {
      await api(`/api/lobby/${code}/join`, { method: 'POST' });
      router.push(`/lobby/${code}`);
    } catch (e) { mostraErro(e.message); }
  }

  return (
    <PageShell
      direita={<UserBadge user={user} onSair={sair} />}
      rodape="resenha-cs v2 — next.js + react"
    >
      <Hero>
        {carregando ? null : !user ? (
          <>
            <Button variante="steam" href="/api/auth/steam">🎮 Entrar com a Steam</Button>
            <Button variante="ct" href={CLIENT_INSTALADOR} download>⬇ Baixar o Client</Button>
          </>
        ) : (
          <>
            <Button variante="tr" onClick={criarLobby}>Criar lobby</Button>
            <JoinLobbyForm onEntrar={entrarLobby} />
          </>
        )}
      </Hero>

      <Alert>{erro}</Alert>

      {user ? (
        <section className="grid-2">
          <div>
            <SectionTitle>Seu perfil</SectionTitle>
            <ProfilePanel user={user} atualizando={atualizando} onAtualizar={atualizarStats} />
          </div>
          <div>
            <SectionTitle>Como funciona</SectionTitle>
            <HowItWorks />
          </div>
        </section>
      ) : null}

      <section className="mt">
        <SectionTitle aside={ranking?.length ? `top ${ranking.length}` : null}>
          Ranking da resenha
        </SectionTitle>
        <Panel>
          {ranking === null ? (
            <Loading>Carregando ranking</Loading>
          ) : ranking.length === 0 ? (
            <EmptyState icone="🏆" titulo="Ninguém jogou ainda">
              O primeiro lugar tá aí, esperando.
            </EmptyState>
          ) : (
            <RankingTable ranking={ranking} eu={user?.steamid} />
          )}
        </Panel>
      </section>
    </PageShell>
  );
}
