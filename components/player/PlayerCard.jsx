'use client';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import { cx } from '@/lib/cx';
import { numero, inteiro } from '@/lib/format';

// destaque: 'a' | 'b' — moldura do time/capitão selecionado
// acao: rótulo da ação de clique (ex.: "escolher"), só aparece se houver onClick
export default function PlayerCard({
  player,
  tags = [],
  destaque = null,
  acao = null,
  onClick,
  className = '',
}) {
  const clicavel = typeof onClick === 'function';
  const premier = inteiro(player.premier);
  const rating = numero(player.leetify_rating, 1);
  const elo = player.elo && player.elo !== 1000 ? player.elo : null;

  return (
    <div
      className={cx('jogador', destaque && `destaque-${destaque}`, clicavel && 'clicavel', className)}
      onClick={onClick}
      role={clicavel ? 'button' : undefined}
      tabIndex={clicavel ? 0 : undefined}
      onKeyDown={clicavel ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      } : undefined}
    >
      <Avatar src={player.avatar} nome={player.name} tamanho="lg" />
      <div className="info">
        <div className="nome">{player.name || player.steamid}</div>
        <div className="tags">
          {tags}
          {premier ? <Tag tom="premier">Premier {premier}</Tag> : null}
          {rating ? <Tag tom="rating">Leetify {rating}</Tag> : null}
          {elo ? <Tag>Elo {elo}</Tag> : null}
        </div>
      </div>
      {clicavel && acao ? <span className="jogador-acao" aria-hidden="true">{acao}</span> : null}
    </div>
  );
}
