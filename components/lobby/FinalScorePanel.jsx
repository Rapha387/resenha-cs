import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import { cx } from '@/lib/cx';

export default function FinalScorePanel({ mapaNome, match, nomeA, nomeB }) {
  const vencedorA = match.winner === 'A';
  return (
    <Panel className="resultado-mapa mt">
      <div className="rotulo">{mapaNome} — placar final</div>
      <div className="placar-final">
        <span className={cx('a', vencedorA && 'venceu')}>{match.score_a}</span>
        <span className="x">×</span>
        <span className={cx('b', !vencedorA && 'venceu')}>{match.score_b}</span>
      </div>
      <p className="vencedor">
        🏆 Vitória do Time <b>{vencedorA ? nomeA : nomeB}</b> — elo atualizado no ranking.
      </p>
      <div className="mt">
        <Button variante="ct" href="/">Voltar pro ranking</Button>
      </div>
    </Panel>
  );
}
