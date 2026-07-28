import PlayerCard from '@/components/player/PlayerCard';
import Tag from '@/components/ui/Tag';
import { cx } from '@/lib/cx';

// lado: 'a' (amarelo TR) | 'b' (azul CT)
export default function TeamColumn({ lado, titulo, jogadores, capitao }) {
  return (
    <section className={cx('time', `time-${lado}`)}>
      <header className="cabecalho">
        <span className="cabecalho-nome">Time {titulo}</span>
        <span className="cabecalho-meta">{jogadores.length}</span>
      </header>
      <div className="lista">
        {jogadores.length === 0 ? (
          <p className="fraco centro time-vazio">Sem ninguém ainda</p>
        ) : (
          jogadores.map(p => (
            <PlayerCard
              key={p.steamid}
              player={p}
              tags={p.steamid === capitao ? [<Tag key="cap" tom="capitao">CAP</Tag>] : []}
            />
          ))
        )}
      </div>
    </section>
  );
}
