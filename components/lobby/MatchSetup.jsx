'use client';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import SectionTitle from '@/components/ui/SectionTitle';
import { cx } from '@/lib/cx';

const MODOS = [
  {
    id: 'capitaes',
    titulo: 'Draft de capitães',
    descricao: 'Clique em dois jogadores acima pra definir os capitães. Eles escolhem o time na vez.',
  },
  {
    id: 'auto',
    titulo: 'Automático',
    descricao: 'O site equilibra os times pelos ratings (Premier, ou elo interno de quem não tem).',
  },
];

export default function MatchSetup({ modo, onModo, onIniciar, capsCompletos, totalJogadores }) {
  const poucosJogadores = totalJogadores < 2;
  const faltaCapitao = modo === 'capitaes' && !capsCompletos;

  return (
    <Panel className="mt">
      <SectionTitle>Montagem dos times</SectionTitle>
      <div className="modo-opcoes">
        {MODOS.map(m => (
          <label key={m.id} className={cx('modo-opcao', modo === m.id && 'ativo')}>
            <input
              type="radio"
              name="modo"
              value={m.id}
              checked={modo === m.id}
              onChange={() => onModo(m.id)}
            />
            <span className="modo-texto">
              <strong>{m.titulo}</strong>
              <span className="fraco">{m.descricao}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="modo-rodape">
        <Button variante="tr" onClick={onIniciar} disabled={poucosJogadores}>
          Iniciar partida
        </Button>
        {poucosJogadores ? (
          <span className="fraco">Precisa de pelo menos 2 jogadores no lobby.</span>
        ) : faltaCapitao ? (
          <span className="fraco">Falta escolher os dois capitães na lista acima.</span>
        ) : null}
      </div>
    </Panel>
  );
}
