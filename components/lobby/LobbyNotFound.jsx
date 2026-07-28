import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Panel from '@/components/ui/Panel';

export default function LobbyNotFound({ code }) {
  return (
    <Panel className="mt">
      <EmptyState icone="🚫" titulo={`Lobby ${code} não encontrado`}>
        Confere o código com quem criou — ele expira quando o servidor zera o banco.
      </EmptyState>
      <div className="centro mt">
        <Button variante="ct" href="/">Voltar pra home</Button>
      </div>
    </Panel>
  );
}
