'use client';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import ClientDownload from '@/components/home/ClientDownload';
import ClientPairCode from '@/components/home/ClientPairCode';
import PlayerCard from '@/components/player/PlayerCard';
import PlayerStats from '@/components/player/PlayerStats';
import { dataHora } from '@/lib/format';

export default function ProfilePanel({ user, atualizando, onAtualizar }) {
  const quando = dataHora(user.stats_updated);

  return (
    <Panel>
      <PlayerCard player={user} />
      <PlayerStats player={user} className="mt-sm" />
      <div className="perfil-rodape">
        <Button tamanho="sm" onClick={onAtualizar} disabled={atualizando}>
          {atualizando ? 'Atualizando…' : 'Atualizar nome e stats'}
        </Button>
        <p className="fraco">
          {quando
            ? `Stats da Leetify atualizados em ${quando}.`
            : 'Sem stats da Leetify ainda. Crie uma conta grátis em leetify.com vinculando sua Steam e clique em atualizar.'}
        </p>
        <ClientDownload compacto />
        <ClientPairCode />
      </div>
    </Panel>
  );
}
